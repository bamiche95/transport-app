-- SQL to create table for WTN email recipients
CREATE TABLE IF NOT EXISTS wtn_email_recipients (
  recipient_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (recipient_id),
  UNIQUE KEY uq_wtn_email (email)
);
