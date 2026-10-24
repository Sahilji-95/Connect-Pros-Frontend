import { createSlice } from "@reduxjs/toolkit";
import {
  getAllComments,
  getAllPost,
  getPostsByUsername,
  createPost,
  deletePost,
  incrementPostLike,
} from "../../action/postAction";

const initialState = {
  posts: [],
  isError: false,
  isLoading: false,
  isSucces: false,
  laggedIn: false,
  message: "",
  comment: [],
  postId: "",
  profilePosts: [],
  profilePostsLoading: false,
  profilePostsError: null,
  createPostLoading: false,
  createPostError: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    reset: () => initialState,
    setPostId: (state, action) => {
      state.postId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPost.pending, (state) => {
        state.isLoading = true;
        state.message = {
          message: "Fetching the All posts",
        };
      })
      .addCase(getAllPost.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSucces = true;
        state.posts = [...action.payload.posts].reverse();
      })
      .addCase(getAllPost.rejected, (state, action) => {
        ((state.isError = true),
          (state.isLoading = false),
          (state.isSucces = false),
          (state.message = {
            message: action.payload,
          }));
      })
      .addCase(getAllComments.fulfilled, (state, action) => {
        state.postId = action.payload.post_id;
        state.comment = action.payload.comments;
      })
      .addCase(getPostsByUsername.pending, (state) => {
        state.profilePostsLoading = true;
        state.profilePostsError = null;
        state.profilePosts = [];
      })
      .addCase(getPostsByUsername.fulfilled, (state, action) => {
        state.profilePostsLoading = false;
        state.profilePosts = action.payload;
      })
      .addCase(getPostsByUsername.rejected, (state, action) => {
        state.profilePostsLoading = false;
        state.profilePostsError = action.payload;
        state.profilePosts = [];
      })

      .addCase(createPost.pending, (state) => {
        state.createPostLoading = true;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createPostLoading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostLoading = false;
        state.createPostError = action.payload;
      })

      .addCase(deletePost.fulfilled, (state, action) => {
        const deletedId = action.payload.post_id;

        state.posts = state.posts.filter((post) => post._id !== deletedId);

        state.profilePosts = state.profilePosts.filter(
          (post) => post._id !== deletedId,
        );
      })
      .addCase(incrementPostLike.fulfilled, (state, action) => {
        const { post_id, likes, isLiked } = action.payload;

        const post = state.posts.find((item) => item._id === post_id);

        if (post) {
          post.likes = likes;
          post.isLiked = isLiked;
        }

        const profilePost = state.profilePosts.find(
          (item) => item._id === post_id,
        );

        if (profilePost) {
          profilePost.likes = likes;
          profilePost.isLiked = isLiked;
        }
      });
  },
});

export default postSlice.reducer;
export const { reset, setPostId } = postSlice.actions;
