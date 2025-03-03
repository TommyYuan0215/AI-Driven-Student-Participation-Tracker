import React from 'react';
import { Container } from 'react-bootstrap';
import useSession from '../../hooks/useSession'; 
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  // to call out session data from databases
  const navigate = useNavigate();
  const { userData, isLoggedIn } = useSession(navigate);

  if (!isLoggedIn) {
    navigate("/"); // Redirect to the home page or login page
    return null; // Prevent rendering the component
  }

  return (
    <Container>
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
    </Container>
  );
};

export default AdminDashboard;