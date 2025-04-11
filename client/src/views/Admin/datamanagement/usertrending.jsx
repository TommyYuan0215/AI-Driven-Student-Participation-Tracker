import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../components/common/LoadingSpinnerComponent";
import PageTitleBreadcrumb from "../../../components/layout/PageTitleBreadcrumbLayout";
import { useLoadingState } from "../../../hooks/useLoadingState";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Form } from "react-bootstrap";

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

  // Get current year
  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    if (userList && userList.length > 0) {
      // Process user data to get cumulative counts by day
      const processedData = processCumulativeUserData(userList);
      setCumulativeUserData(processedData);

      // Extract available months for filtering
      const months = extractAvailableMonths(userList);
      setAvailableMonths(months);

      // Set initial selectedMonth to current year if available
      if (selectedMonth === "all" && months.length > 0) {
        // Try to find current year in the available months
        const currentYearMonths = months.filter((month) =>
          month.startsWith(currentYear)
        );
        if (currentYearMonths.length > 0) {
          // If current year exists, select the first month of current year
          setSelectedMonth(currentYearMonths[0]);
        }
      }
    }
  }, [userList]);

  // Update filtered data when month filter or cumulative data changes
  useEffect(() => {
    if (cumulativeUserData.length > 0) {
      if (selectedMonth === "all") {
        // For "All Time" view, take the full dataset but ensure it's processed correctly
        setFilteredUserData(calculateCumulativeTotals(cumulativeUserData));
      } else {
        // Filter the data for the selected month
        const filtered = filterDataByMonth(cumulativeUserData, selectedMonth);
        setFilteredUserData(filtered);
      }
    }
  }, [selectedMonth, cumulativeUserData]);

  // Helper function to extract just the date part from createAt
  const extractDatePart = (createAt) => {
    try {
      if (!createAt) return null;

      // If the format is "2025-04-03, 03:27 PM", extract just "2025-04-03"
      if (createAt.includes(", ")) {
        return createAt.split(", ")[0];
      }

      // If it's already a date string in another format, try to parse and format it
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
    // Group users by date of creation
    const usersByDate = new Map();
    let validUserCount = 0;
    let invalidUserCount = 0;

    data.forEach((user) => {
      if (user && user.createAt) {
        // Extract just the date part
        const dateStr = extractDatePart(user.createAt);

        if (dateStr) {
          validUserCount++;
          if (!usersByDate.has(dateStr)) {
            usersByDate.set(dateStr, 1);
          } else {
            usersByDate.set(dateStr, usersByDate.get(dateStr) + 1);
          }
        } else {
          invalidUserCount++;
        }
      } else {
        invalidUserCount++;
      }
    });

    console.log(
      `Valid users: ${validUserCount}, Invalid users: ${invalidUserCount}`
    );

    // Convert map to array and sort by date
    const sortedDates = Array.from(usersByDate.keys()).sort();

    // Calculate daily count (not cumulative across all time)
    const dailyData = sortedDates.map((dateStr) => {
      // Get count for this specific day
      const dailyCount = usersByDate.get(dateStr);

      // Format date for display (MM/DD/YYYY)
      const [year, month, day] = dateStr.split("-");
      const displayDate = `${month}/${day}/${year}`;

      return {
        date: displayDate,
        rawDate: dateStr,
        usersPerDay: dailyCount,
        yearMonth: `${year}-${month}`, // Add yearMonth for easier filtering
      };
    });

    return dailyData;
  };

  // Function to extract all available months from user data
  const extractAvailableMonths = (data) => {
    const monthsSet = new Set();

    data.forEach((user) => {
      if (user && user.createAt) {
        const dateStr = extractDatePart(user.createAt);
        if (dateStr) {
          // Extract year and month from the date (YYYY-MM)
          const yearMonth = dateStr.substring(0, 7);
          monthsSet.add(yearMonth);
        }
      }
    });

    // Convert Set to Array and sort
    return Array.from(monthsSet).sort();
  };

  // Function to filter data by selected month
  const filterDataByMonth = (data, monthFilter) => {
    // If no specific month is selected, return all data with running totals
    if (monthFilter === "all") {
      return calculateCumulativeTotals(data);
    }

    // Filter the data to only include dates from the selected month
    const filteredData = data.filter((item) => item.yearMonth === monthFilter);

    // Calculate running total for the month
    return calculateMonthlyRunningTotal(filteredData);
  };

  // Calculate running total for all-time data
  const calculateCumulativeTotals = (data) => {
    if (!data || data.length === 0) return [];

    // Sort the data by date to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      return new Date(a.rawDate) - new Date(b.rawDate);
    });

    // Calculate running total for each day across all time
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

  // Calculate running total for each day in the filtered dataset
  const calculateMonthlyRunningTotal = (data) => {
    if (!data || data.length === 0) return [];

    // Sort the data by date to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      return new Date(a.rawDate) - new Date(b.rawDate);
    });

    // Calculate running total for each day
    let runningTotal = 0;
    return sortedData.map((item) => {
      runningTotal += item.usersPerDay;
      return {
        date: item.date,
        cumulativeUsers: runningTotal,
        newUsers: item.usersPerDay, // Keep the daily count for reference
      };
    });
  };

  // Format month for display (e.g., "2025-04" to "April 2025")
  const formatMonthDisplay = (monthYearStr) => {
    if (monthYearStr === "all") return "All Time";

    const [year, month] = monthYearStr.split("-");
    const date = new Date(year, parseInt(month) - 1, 1);

    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Render the component content
  const renderUserTrendContent = () => {
    if (loading) {
      return <LoadingSpinner text="Loading user data..." />;
    }

    if (!userList || userList.length === 0) {
      return (
        <div className="text-center my-3 text-muted">
          <i
            className="bi bi-emoji-neutral"
            style={{ fontSize: "2rem", opacity: 0.7 }}
          ></i>
          <h6 className="mt-2">No user data available</h6>
        </div>
      );
    }

    return (
      <>
        <section className="px-3 py-2">
          {filteredUserData.length === 0 ? (
            <div className="text-center my-3">
              <p className="small">No data available for the selected period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isEmbedded ? 250 : 500}>
              <LineChart data={filteredUserData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isEmbedded ? 10 : 12 }}
                  tickFormatter={
                    isEmbedded
                      ? (value) => {
                          // Shorten date format for embedded view
                          const parts = value.split("/");
                          return `${parts[0]}/${parts[1]}`;
                        }
                      : undefined
                  }
                  label={{
                    value: "Date Registered",
                    position: "bottom",
                    offset: -8,
                  }}
                />
                <YAxis
                  tick={{ fontSize: isEmbedded ? 10 : 12 }}
                  width={isEmbedded ? 30 : 40}
                  label={{
                    value: "Emotion Count",
                    angle: -90,
                    position: "left",
                    offset: -5,
                  }}
                />
                <Tooltip />
                <Legend
                  verticalAlign="top"
                  height={isEmbedded ? 24 : 36}
                  wrapperStyle={{ fontSize: isEmbedded ? "0.8rem" : "1rem" }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeUsers"
                  name="Total Users"
                  stroke="#ff7300"
                  strokeWidth={2}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users per Day"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </>
    );
  };

  // If embedded, return just the content without the page title and extra wrapping
  if (isEmbedded) {
    return renderUserTrendContent();
  }

  // Otherwise, return the full standalone page
  return (
    <>
      <PageTitleBreadcrumb
        title="User Growth Trend"
        path={location.pathname}
        isAddNew={true}
        btnTitle="Generate Report"
        btnIcon="bi-file-earmark-text"
      />
      <div className="m-4 card px-3">
        <div
          className={"px-3 m-4"}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Form.Label className="me-2 mb-0" style={{ width: "10%" }}>
            Filter by Month:
          </Form.Label>
          <Form.Select
            style={{ width: "90%" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">All Time</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthDisplay(month)}
              </option>
            ))}
          </Form.Select>
        </div>
        {renderUserTrendContent()}
      </div>
    </>
  );
}

export default UserTrendingDashboard;
