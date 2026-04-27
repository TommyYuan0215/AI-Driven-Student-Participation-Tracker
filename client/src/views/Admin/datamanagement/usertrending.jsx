import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useLoadingState } from "../../../hooks/useLoadingState";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Form, Row, Col } from "react-bootstrap";

function UserTrendingDashboard({ isEmbedded = false }) {
  const location = useLocation();

  // Call API endpoint for user data
  const { data: userList, loading } = useLoadingState(
    "/usermanagement/get_user_data",
    []
  );

  // State for cumulative user data by day
  const [cumulativeUserData, setCumulativeUserData] = useState([]);

  // State for month filter
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [filteredUserData, setFilteredUserData] = useState([]);

  useEffect(() => {
    if (userList && userList.length > 0) {
      // Process user data to get cumulative counts by day
      const processedData = processCumulativeUserData(userList);
      setCumulativeUserData(processedData);

      // Extract available months for filtering
      const months = extractAvailableMonths(userList);
      setAvailableMonths(months);

      // Set initial selectedMonth to current month if available, else 'all'
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (months.includes(currentMonth)) {
        setSelectedMonth(currentMonth);
      } else {
        setSelectedMonth("all");
      }
    }
  }, [userList]);

  // Update filtered data when month filter or cumulative data changes
  useEffect(() => {
    if (cumulativeUserData.length > 0) {
      if (selectedMonth === "all") {
        setFilteredUserData(calculateCumulativeTotals(cumulativeUserData));
      } else {
        const filtered = filterDataByMonth(cumulativeUserData, selectedMonth);
        setFilteredUserData(filtered);
      }
    }
  }, [selectedMonth, cumulativeUserData]);

  // Helper function to extract just the date part from createAt
  const extractDatePart = (createAt) => {
    try {
      if (!createAt) return null;
      if (createAt.includes(", ")) {
        return createAt.split(", ")[0];
      }
      const date = new Date(createAt);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
      return null;
    } catch (error) {
      console.error("Error extracting date:", createAt, error);
      return null;
    }
  };

  // Function to process user data and calculate cumulative count by day
  const processCumulativeUserData = (data) => {
    const usersByDate = new Map();
    data.forEach((user) => {
      if (user && user.createAt) {
        const dateStr = extractDatePart(user.createAt);
        if (dateStr) {
          usersByDate.set(dateStr, (usersByDate.get(dateStr) || 0) + 1);
        }
      }
    });

    const sortedDates = Array.from(usersByDate.keys()).sort();
    return sortedDates.map((dateStr) => {
      const [year, month, day] = dateStr.split("-");
      return {
        date: `${month}/${day}/${year}`,
        rawDate: dateStr,
        usersPerDay: usersByDate.get(dateStr),
        yearMonth: `${year}-${month}`,
      };
    });
  };

  const extractAvailableMonths = (data) => {
    const monthsSet = new Set();
    data.forEach((user) => {
      if (user && user.createAt) {
        const dateStr = extractDatePart(user.createAt);
        if (dateStr) {
          monthsSet.add(dateStr.substring(0, 7));
        }
      }
    });
    return Array.from(monthsSet).sort();
  };

  const filterDataByMonth = (data, monthFilter) => {
    if (monthFilter === "all") return calculateCumulativeTotals(data);
    const filteredData = data.filter((item) => item.yearMonth === monthFilter);
    return calculateMonthlyRunningTotal(filteredData);
  };

  const calculateCumulativeTotals = (data) => {
    if (!data || data.length === 0) return [];
    const sortedData = [...data].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
    let runningTotal = 0;
    return sortedData.map((item) => {
      runningTotal += item.usersPerDay;
      return {
        date: item.date,
        cumulativeUsers: runningTotal,
        newUsers: item.usersPerDay,
      };
    });
  };

  const calculateMonthlyRunningTotal = (data) => {
    if (!data || data.length === 0) return [];
    const sortedData = [...data].sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
    let runningTotal = 0;
    return sortedData.map((item) => {
      runningTotal += item.usersPerDay;
      return {
        date: item.date,
        cumulativeUsers: runningTotal,
        newUsers: item.usersPerDay,
      };
    });
  };

  const formatMonthDisplay = (monthYearStr) => {
    if (monthYearStr === "all") return "All Time";
    const [year, month] = monthYearStr.split("-");
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const summary = (() => {
    if (!filteredUserData || filteredUserData.length === 0) return null;
    const totalUsers = filteredUserData[filteredUserData.length - 1]?.cumulativeUsers || 0;
    const newUsers = filteredUserData.reduce((sum, d) => sum + (d.newUsers || 0), 0);
    const avgNewUsers = filteredUserData.length > 0 ? (newUsers / filteredUserData.length).toFixed(1) : 0;
    return { totalUsers, newUsers, avgNewUsers };
  })();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-4 shadow-lg border-0" style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          minWidth: '180px',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div className="small text-muted fw-bold mb-2 pb-2 border-bottom">{label}</div>
          {payload.map((entry, idx) => (
            <div key={idx} className="d-flex align-items-center justify-content-between gap-3 mb-1">
              <span className="small fw-medium" style={{ color: '#4b5563' }}>{entry.name}:</span>
              <span className="fw-bold" style={{ color: entry.color }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner text="Synchronizing growth data..." />;
    if (!userList || userList.length === 0) {
      return (
        <div className="text-center py-5 opacity-50">
          <i className="bi bi-graph-up-arrow fs-1"></i>
          <h5 className="mt-3">No Trajectory Data Found</h5>
        </div>
      );
    }

    return (
      <div className={`d-flex flex-column ${isEmbedded ? "h-100" : "gap-4"}`}>
        {/* Summary Row - Only show if NOT embedded */}
        {!isEmbedded && (
          <Row className="g-3">
            <Col md={4}>
              <div className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
                <div className="position-absolute top-0 end-0 p-3 opacity-25">
                  <i className="bi bi-people-fill fs-1"></i>
                </div>
                <div className="small fw-bold opacity-75 text-uppercase ls-1 mb-1">Lifetime Users</div>
                <div className="display-6 fw-bold mb-0">{summary?.totalUsers || 0}</div>
                <div className="small opacity-50 mt-2 fw-medium">Across all registered periods</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
                <div className="position-absolute top-0 end-0 p-3 opacity-10 text-primary">
                  <i className="bi bi-person-plus-fill fs-1"></i>
                </div>
                <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">New Registrations</div>
                <div className="display-6 fw-bold text-primary mb-0">{summary?.newUsers || 0}</div>
                <div className="small text-muted mt-2 fw-medium">During current selected filter</div>
              </div>
            </Col>
            <Col md={4}>
              <div className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden" style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color-translucent)' }}>
                <div className="position-absolute top-0 end-0 p-3 opacity-10 text-success">
                  <i className="bi bi-speedometer2 fs-1"></i>
                </div>
                <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Growth Velocity</div>
                <div className="display-6 fw-bold text-success mb-0">{summary?.avgNewUsers || 0}</div>
                <div className="small text-muted mt-2 fw-medium">Avg. new users per day</div>
              </div>
            </Col>
          </Row>
        )}

        {/* Chart Section */}
        <div className={isEmbedded ? "h-100 d-flex flex-column" : "card border-0 rounded-4 shadow-lg overflow-hidden"} style={isEmbedded ? {} : { 
          background: 'var(--bs-body-bg)',
          border: '1px solid var(--bs-border-color-translucent)'
        }}>
          {!isEmbedded && (
            <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-0 fw-bold text-uppercase opacity-50" style={{ fontSize: '0.7rem', letterSpacing: '1.5px' }}>Growth Trajectory</h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-bold">Period:</span>
                <Form.Select
                  size="sm"
                  className="rounded-pill border-0 shadow-sm px-3"
                  style={{ width: "180px", background: 'var(--bs-tertiary-bg)' }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All Time History</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>{formatMonthDisplay(month)}</option>
                  ))}
                </Form.Select>
              </div>
            </div>
          )}
          <div className={isEmbedded ? "flex-fill p-0" : "card-body p-4"}>
            <div style={{ height: isEmbedded ? '100%' : '450px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredUserData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bs-border-color-translucent)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--bs-secondary-color)', fontSize: 11 }}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--bs-secondary-color)', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" height={40} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="cumulativeUsers"
                    name="Lifetime Growth"
                    stroke="#6366f1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    activeDot={{ r: 6, strokeWidth: 0, shadow: '0 0 10px rgba(99, 102, 241, 0.5)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="Daily Velocity"
                    stroke="#ec4899"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorNew)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={isEmbedded ? "h-100 w-100" : "py-2 fade-in"}>
      {!isEmbedded && (
        <PageTitleBreadcrumb
          title="User Growth Analytics"
          path={location.pathname}
          icon="bi-graph-up-arrow"
        />
      )}
      <div className={isEmbedded ? "h-100" : "mt-2"}>
        {renderContent()}
      </div>
    </div>
  );
}

export default UserTrendingDashboard;
