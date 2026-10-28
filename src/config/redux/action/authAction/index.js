import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "@/config";

// LOGIN
export const loginUser = createAsyncThunk(
  "user/login",
  async (user, thunkAPI) => {
    try {
      const response = await clientServer.post("/login", {
        email: user.email,
        password: user.password,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Login failed",
        },
      );
    }
  },
);

//LOGOUT
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientServer.post(
        "/logout",
        {},
        {
          withCredentials: true,
        },
      );

      return response.data;
    } catch (error) {
      console.error("Logout API error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  },
);

// GET LOGGED-IN USER PROFILE
export const getAboutUser = createAsyncThunk(
  "user/aboutUser",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/get_user_and_profile");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch user profile",
        },
      );
    }
  },
);

// GET ALL USERS
export const getAllUsers = createAsyncThunk(
  "user/get_all_user",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/user/get_all_user");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch users",
        },
      );
    }
  },
);

// GET PROFILE BY USERNAME
export const getProfileByUsername = createAsyncThunk(
  "user/getProfileByUsername",
  async (username, thunkAPI) => {
    try {
      const response = await clientServer.get("/user/get_profile_by_username", {
        params: { username },
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch profile",
        },
      );
    }
  },
);

// SEND CONNECTION REQUEST
export const sendConnectionRequest = createAsyncThunk(
  "user/sendConnectionRequest",
  async (data, thunkAPI) => {
    try {
      const response = await clientServer.post(
        "/user/send_connection_request",
        {
          connectionId: data.user_id,
        },
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to send connection request",
        },
      );
    }
  },
);

// GET CONNECTION REQUESTS
export const getConnectionRequests = createAsyncThunk(
  "user/getConnectionRequests",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/user/get_connection_request");

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch connection requests",
        },
      );
    }
  },
);

// GET ALL CONNECTIONS
export const getAllConnections = createAsyncThunk(
  "user/getAllConnections",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get(
        "/user/get_all_connection_request",
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch connections",
        },
      );
    }
  },
);

// ACCEPT / REJECT CONNECTION REQUEST
export const acceptConnectionRequest = createAsyncThunk(
  "user/acceptConnectionRequest",
  async (data, thunkAPI) => {
    try {
      const response = await clientServer.post(
        "/user/accept_connection_request",
        {
          requestId: data.requestId,
          action_type: data.action,
        },
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Connection request failed",
        },
      );
    }
  },
);

//GET LOGEED IN USER CONNECTION
export const getAllMyConnections = createAsyncThunk(
  "auth/getAllMyConnections",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/user/get_my_connections");

      return response.data.connections;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch connections",
      );
    }
  },
);

export const deleteConnection = createAsyncThunk(
  "auth/deleteConnection",
  async (connectionId, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/delete_connection", {
        connectionId,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete connection",
      );
    }
  },
);

//UPDATE / UPLOAD PROFILE PICTURE
export const uploadProfilePicture = createAsyncThunk(
  "auth/uploadProfilePicture",
  async (imageFile, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("profile_picture", imageFile);

      const response = await clientServer.post(
        "/upload_profile_picture",
        formData,
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Profile picture upload failed",
        },
      );
    }
  },
);

//UPDATE PROFILE PERSONAL DETAILS
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (userData, thunkAPI) => {
    try {
      const response = await clientServer.post("/update_profile", userData);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to update user details",
        },
      );
    }
  },
);

//UPDATE PROFILE OTHER DETAILS
export const updateProfileData = createAsyncThunk(
  "auth/updateProfileData",
  async (profileData, thunkAPI) => {
    try {
      const response = await clientServer.post(
        "/profile_to_update",
        profileData,
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to update profile details",
        },
      );
    }
  },
);

export const sendEmailOtp = createAsyncThunk(
  "auth/sendEmailOtp",
  async (userData, thunkAPI) => {
    try {
      const response = await clientServer.post("/send-email-otp", userData);

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to send OTP",
        },
      );
    }
  },
);

// 2. Email OTP verify karna
export const verifyEmailOtp = createAsyncThunk(
  "auth/verifyEmailOtp",
  async ({ email, otp }, thunkAPI) => {
    try {
      const response = await clientServer.post("/verify-email-otp", {
        email,
        otp,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to verify OTP",
        },
      );
    }
  },
);

// 3. OTP dobara bhejna
export const resendEmailOtp = createAsyncThunk(
  "auth/resendEmailOtp",
  async ({ email }, thunkAPI) => {
    try {
      const response = await clientServer.post("/resend-email-otp", {
        email,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to resend OTP",
        },
      );
    }
  },
);

/* FORGOT PASSWORD: Send OTP */
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, thunkAPI) => {
    try {
      const response = await clientServer.post("/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to send reset OTP",
        },
      );
    }
  },
);

/* VERIFY PASSWORD RESET OTP */
export const verifyResetOTP = createAsyncThunk(
  "auth/verifyResetOTP",
  async ({ email, otp }, thunkAPI) => {
    try {
      const response = await clientServer.post("/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to verify reset OTP",
        },
      );
    }
  },
);

/* RESEND PASSWORD RESET OTP */
export const resendResetOTP = createAsyncThunk(
  "auth/resendResetOTP",
  async ({ email }, thunkAPI) => {
    try {
      const response = await clientServer.post("/resend-reset-otp", {
        email: email.trim().toLowerCase(),
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to resend reset OTP",
        },
      );
    }
  },
);

/* RESET PASSWORD */
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, newPassword, confirmPassword }, thunkAPI) => {
    try {
      const response = await clientServer.post("/reset-password", {
        resetToken,
        newPassword,
        confirmPassword,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Unable to reset password",
        },
      );
    }
  },
);

export const searchUsers = createAsyncThunk(
  "auth/searchUsers",
  async ({ q, cursor = null, append = false }, { rejectWithValue }) => {
    try {
      const response = await clientServer.get("/user/search", {
        params: {
          q,
          ...(cursor ? { cursor } : {}),
        },
      });

      return {
        ...response.data,
        q,
        append,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Unable to search users. Please try again.",
      );
    }
  },
);
