import { createSlice } from "@reduxjs/toolkit";
import {
  getAboutUser,
  getAllUsers,
  loginUser,
  // registerUser,
  getProfileByUsername,
  getConnectionRequests,
  getAllConnections,
  getAllMyConnections,
  uploadProfilePicture,
  updateUserProfile,
  updateProfileData,
  logoutUser,
  sendEmailOtp,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  verifyResetOTP,
  resendResetOTP,
  resetPassword,
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
  emailOtpLoading: false,
  verifyOtpLoading: false,
  resendOtpLoading: false,
  emailOtpMessage: null,
  emailOtpError: null,
  isEmailVerified: false,
  pendingVerificationEmail: null,
  forgotPasswordLoading: false,
  verifyResetPasswordOtpLoading: false,
  resendResetPasswordOtpLoading: false,
  resetPasswordLoading: false,
  forgotPasswordMessage: "",
  forgotPasswordError: null,
  verifyResetPasswordOtpMessage: "",
  verifyResetPasswordOtpError: null,
  resendResetPasswordOtpMessage: "",
  resendResetPasswordOtpError: null,
  resetPasswordMessage: "",
  resetPasswordError: null,
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

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.profileFetched = false;
        state.isTokenThere = false;
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
      })

      .addCase(sendEmailOtp.pending, (state) => {
        state.emailOtpLoading = true;
        state.emailOtpError = null;
        state.emailOtpMessage = null;
      })
      .addCase(sendEmailOtp.fulfilled, (state, action) => {
        state.emailOtpLoading = false;
        state.emailOtpMessage = action.payload.message;
      })
      .addCase(sendEmailOtp.rejected, (state, action) => {
        state.emailOtpLoading = false;
        state.emailOtpError = action.payload?.message || "Unable to send OTP";
      })

      .addCase(verifyEmailOtp.pending, (state) => {
        state.verifyOtpLoading = true;
        state.emailOtpError = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.verifyOtpLoading = false;
        state.isEmailVerified = true;
        state.emailOtpMessage = action.payload.message;
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.verifyOtpLoading = false;
        state.emailOtpError =
          action.payload?.message || "OTP verification failed";
      })

      .addCase(resendEmailOtp.pending, (state) => {
        state.resendOtpLoading = true;
        state.emailOtpError = null;
      })
      .addCase(resendEmailOtp.fulfilled, (state, action) => {
        state.resendOtpLoading = false;
        state.emailOtpMessage = action.payload.message;
      })
      .addCase(resendEmailOtp.rejected, (state, action) => {
        state.resendOtpLoading = false;
        state.emailOtpError = action.payload?.message || "Unable to resend OTP";
      })

      // FORGOT PASSWORD: SEND OTP
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordMessage = "";
        state.forgotPasswordError = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordMessage =
          action.payload?.message || "Reset OTP sent successfully.";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError =
          action.payload?.message || "Unable to send reset OTP.";
      })

      // VERIFY RESET OTP
      .addCase(verifyResetOTP.pending, (state) => {
        state.verifyResetPasswordOtpLoading = true;
        state.verifyResetPasswordOtpMessage = "";
        state.verifyResetPasswordOtpError = null;
      })
      .addCase(verifyResetOTP.fulfilled, (state, action) => {
        state.verifyResetPasswordOtpLoading = false;
        state.verifyResetPasswordOtpMessage =
          action.payload?.message || "OTP verified successfully.";
      })
      .addCase(verifyResetOTP.rejected, (state, action) => {
        state.verifyResetPasswordOtpLoading = false;
        state.verifyResetPasswordOtpError =
          action.payload?.message || "OTP verification failed.";
      })

      // RESEND RESET OTP
      .addCase(resendResetOTP.pending, (state) => {
        state.resendResetPasswordOtpLoading = true;
        state.resendResetPasswordOtpMessage = "";
        state.resendResetPasswordOtpError = null;
      })
      .addCase(resendResetOTP.fulfilled, (state, action) => {
        state.resendResetPasswordOtpLoading = false;
        state.resendResetPasswordOtpMessage =
          action.payload?.message || "A new OTP has been sent.";
      })
      .addCase(resendResetOTP.rejected, (state, action) => {
        state.resendResetPasswordOtpLoading = false;
        state.resendResetPasswordOtpError =
          action.payload?.message || "Unable to resend OTP.";
      })

      // RESET PASSWORD
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.resetPasswordMessage = "";
        state.resetPasswordError = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordMessage =
          action.payload?.message || "Password reset successfully.";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError =
          action.payload?.message || "Unable to reset password.";
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
