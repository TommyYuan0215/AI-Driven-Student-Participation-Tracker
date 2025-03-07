import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import useSession from '../../utils/sessionUtils'; 
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

function AdminDashboard() {
  
  // to call out session data from databases
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);
  const [loading, setLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoggedIn) {
    navigate("/"); // Redirect to the home page or login page
    return null; // Prevent rendering the component
  }

  return (
    <Container>
      {loading ? (
        <LoadingSpinner text="Loading dashboard..." />
      ) : (
      <>
        <h4 className="p-3">Hello, {userData.userName} &#128075;</h4>
        <br />
        <div className='row'>
          <div className='col-md-12'>
            <div className='card'>
              <div className='card-header'>
                <h6>Notifications Area</h6>
              </div>
              
              <div className='card-body' style={{position: 'relative', height: '180px', width: '100%'}}>
                  
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className='row'>
          <div className='col-md-3'>
            <div className='card' >
              <div style={{position: 'relative', height: '250px', width: '100%'}}>
                  
              </div>
            </div>
          </div>
          <div className='col-md-3'>
            <div className='card'>
              <div style={{position: 'relative', height: '250px', width: '100%'}}>
                  
              </div>
            </div>
          </div>
          <div className='col-md-3'>
            <div className='card'>
              <div style={{position: 'relative', height: '250px', width: '100%'}}>
                  
              </div>
            </div>
          </div>
          <div className='col-md-3'>
            <div className='card'>
              <div style={{position: 'relative', height: '250px', width: '100%'}}>
                  
              </div>
            </div>
          </div>
        </div>
      </>
      )};
    </Container>
  );
};

export default AdminDashboard;