import React from "react";
import { Table } from "react-bootstrap"; // Assuming you're using react-bootstrap

const ProfileCard = ({ userData }) => {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{
          height: "90px",
          background: "linear-gradient(to right, #3b2ee2, #de1e82)",
        }}
      ></div>
      <div className="position-relative" style={{ height: "0px" }}>
        <div
          className="position-absolute"
          style={{
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img
            src={
              userData.userPhoto
                ? `data:image/jpeg;base64,${userData.userPhoto}`
                : "/profile.jpg"
            }
            alt="User"
            className="rounded-circle mx-auto d-block img-thumbnail"
            style={{
              width: "120px",
              height: "120px",
              objectFit: "cover",
            }}
          />
        </div>
      </div>
      <div
        className="card-body"
        style={{ marginTop: "60px", paddingTop: "20px" }}
      >
        <Table hover responsive>
          <tbody>
            <tr>
              <th className="col-4">Name:</th>
              <td className="col-8 text-justify">{userData.userName}</td>
            </tr>
            <tr>
              <th className="col-4">Type of User:</th>
              <td className="col-8 text-justify">
                {userData?.userType === 0 ? "Administrator" : "Educator"}
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ProfileCard;
