let accessToken = null;
let userData = null;
let userBooking = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  userData = null;
  userBooking = null;
};

export const setUserData = (user) => {
  userData = user;
};

export const getUserData = () => {
  return userData;
};

export const setUserBooking = (booking) => {
  userBooking = booking;
};

export const getUserBooking = () => {
  return userBooking;
};

export const getCurrentUser = () => {
  return getUserData();
}