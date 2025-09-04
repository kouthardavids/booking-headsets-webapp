CREATE DATABASE IF NOT EXISTS request_headsets;
USE request_headsets;

-- Users table
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  google_id VARCHAR(255) UNIQUE DEFAULT NULL,
  is_google_user TINYINT DEFAULT 0,
  resetToken VARCHAR(64) DEFAULT NULL,
  resetTokenExpiry DATETIME DEFAULT NULL
);

-- Headset availability table
CREATE TABLE headsets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station VARCHAR(50) UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

INSERT INTO headsets (station, is_available) VALUES
('Headset01', TRUE),
('Headset02', TRUE),
('Headset03', TRUE),
('Headset04', TRUE),
('Headset05', TRUE),
('Headse06', TRUE),
('Headse07', TRUE),
('Headset08', TRUE),
('Headset09', TRUE),
('Headset10', TRUE),
('Headset11', TRUE),
('Headset12', TRUE),
('Headset13', TRUE),
('Headset14', TRUE),
('Headset15', TRUE);

-- Requests table
CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  headset_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'borrowed',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  returned_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (headset_id) REFERENCES headsets(id)
);