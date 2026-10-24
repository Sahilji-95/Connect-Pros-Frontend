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

// REGISTER
// export const registerUser = createAsyncThunk(
//   "user/register",
//   async (user, thunkAPI) => {
//     try {
//       const response = await clientServer.post("/register", {
//         name: user.name,
//         username: user.username,
//         email: user.email,
//         password: user.password,
//       });

//       return response.data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(
//         error.response?.data || {
//           message: error.message || "Registration failed",
//         },
//       );
//     }
//   },
// );

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
      const response = await clientServer.post(
        "/user/send-email-otp",
        userData,
      );

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
      const response = await clientServer.post("/user/verify-email-otp", {
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
      const response = await clientServer.post("/user/resend-email-otp", {
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
