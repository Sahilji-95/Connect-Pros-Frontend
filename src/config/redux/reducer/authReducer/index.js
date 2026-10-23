import { createSlice } from "@reduxjs/toolkit";
import {
  getAboutUser,
  getAllUsers,
  loginUser,
  registerUser,
  getProfileByUsername,
  getConnectionRequests,
  getAllConnections,
  getAllMyConnections,
  uploadProfilePicture,
  updateUserProfile,
  updateProfileData,
} from "../../action/authAction";

const initialState = {
  user: [],
  token: null,
  isError: false,
  isLoading: false,
  isSucces: false,
  laggedIn: false,
  message: "",
  isTokenThere: false,
  profileFetched: false,
  connection: [],
  connectionRequest: [],
  myConnections: [],
  all_profiles_fetched: false,
  all_profiles: [],
  profileByUsername: null,
  profileLoading: false,
  profileError: null,
  isUpdatingProfile: false,
  updateProfileError: null,
  updateProfileSuccess: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    reset: () => initialState,

    handleLoginUser: (state) => {
      state.message = {
        message: "Welcome Back",
      };
    },

    emptyMessage: (state) => {
      state.message = "";
    },

    setTokenIsThere: (state) => {
      state.isTokenThere = true;
    },

    SetTokenIsNotThere: (state) => {
      state.isTokenThere = false;
      state.laggedIn = false;
      state.token = null;
    },

    setToken: (state, action) => {
      state.token = null;
      state.isTokenThere = Boolean(action.payload);
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSucces = false;
        state.message = {
          message: "Logging in...",
        };
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSucces = true;
        state.laggedIn = true;
        state.isTokenThere = true;
        state.token = null;

        state.message = {
          message: action.payload?.message || "Login successful",
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSucces = false;
        state.laggedIn = false;
        state.isTokenThere = false;
        state.token = null;
        state.message = action.payload || {
          message: "Login failed",
        };
      })

      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSucces = false;
        state.message = {
          message: "Registering you...",
        };
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSucces = true;
        state.message = {
          message: action.payload?.message || "Registration successful",
        };
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSucces = false;
        state.message = action.payload || {
          message: "Registration failed",
        };
      })

      .addCase(getAboutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.profileFetched = true;
        state.isTokenThere = true;
        state.laggedIn = true;
        state.user = action.payload.profile;
      })
      .addCase(getAboutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.profileFetched = false;

        if (action.payload?.status === 401) {
          state.isTokenThere = false;
          state.laggedIn = false;
          state.token = null;
          state.user = [];
        }
      })

      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.all_profiles_fetched = true;
        state.all_profiles = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(getProfileByUsername.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
        state.profileByUsername = null;
      })
      .addCase(getProfileByUsername.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profileByUsername = action.payload;
        state.profileError = null;
      })
      .addCase(getProfileByUsername.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileByUsername = null;
        state.profileError =
          action.payload?.message || "Failed to fetch profile";
      })

      .addCase(getConnectionRequests.fulfilled, (state, action) => {
        state.connection = action.payload;
      })
      .addCase(getConnectionRequests.rejected, (state, action) => {
        state.message = action.payload;
      })

      .addCase(getAllConnections.fulfilled, (state, action) => {
        state.connectionRequest = action.payload;
      })
      .addCase(getAllConnections.rejected, (state, action) => {
        state.message = action.payload;
      })
      .addCase(getAllMyConnections.fulfilled, (state, action) => {
        state.myConnections = action.payload;
      })

      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })

      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        const newPicture = action.payload.profilePicture;
        if (state.user?.userId) {
          state.user.userId.profilePicture = newPicture;
        }
        state.message = action.payload.message || "Profile picture updated";
      })

      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Upload failed";
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdatingProfile = true;
        state.updateProfileError = null;
        state.updateProfileSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.isUpdatingProfile = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.updateProfileError =
          action.payload?.message || "Failed to update user details";
      })

      .addCase(updateProfileData.pending, (state) => {
        state.isUpdatingProfile = true;
        state.updateProfileError = null;
      })
      .addCase(updateProfileData.fulfilled, (state) => {
        state.isUpdatingProfile = false;
        state.updateProfileSuccess = true;
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.updateProfileError =
          action.payload?.message || "Failed to update profile details";
      });
  },
});

export const {
  reset,
  handleLoginUser,
  emptyMessage,
  setTokenIsThere,
  SetTokenIsNotThere,
  setToken,
} = authSlice.actions;

export default authSlice.reducer;
