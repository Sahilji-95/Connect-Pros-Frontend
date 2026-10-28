import clientServer from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

//GET ALL POSTS
export const getAllPost = createAsyncThunk(
  "post/getAllPosts",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/post/get_post", {});

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch posts",
      );
    }
  },
);

//CREATE NEW POST
export const createPost = createAsyncThunk(
  "post/createPost",
  async (userData, thunkAPI) => {
    const { file, body } = userData;

    try {
      const formData = new FormData();

      formData.append("body", body);

      if (file) {
        formData.append("media", file);
      }

      const response = await clientServer.post(
        "/post/create_post",
        formData,
        {},
      );

      return response.data.post;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Post upload failed",
      );
    }
  },
);

//DELTE POST
export const deletePost = createAsyncThunk(
  "post/delete",
  async ({ post_id }, thunkAPI) => {
    try {
      const response = await clientServer.delete("/post/delete_post", {
        data: { post_id },
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete post",
      );
    }
  },
);

//INCREMENT LIKES
export const incrementPostLike = createAsyncThunk(
  "post/incrementPostLike",
  async ({ post_id }, thunkAPI) => {
    try {
      const response = await clientServer.post("/post/like", { post_id }, {});

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message,
        },
      );
    }
  },
);

//GET ALL COMMENTS
export const getAllComments = createAsyncThunk(
  "post/getAllComment",
  async (postData, thunkAPI) => {
    try {
      const response = await clientServer.get("/comment/get_comment", {
        params: {
          post_id: postData.post_id,
        },
      });

      return thunkAPI.fulfillWithValue({
        comments: response.data,
        post_id: postData.post_id,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message,
        },
      );
    }
  },
);

//POST NEW COMMENT
export const postComment = createAsyncThunk(
  "post/postComment",
  async (commentData, thunkAPI) => {
    try {
      const response = await clientServer.post("/comment/create_comment", {
        comment: commentData.body,
        post_id: commentData.post_id,
      });

      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message,
        },
      );
    }
  },
);

//GET POST BY USERNAME
export const getPostsByUsername = createAsyncThunk(
  "post/getPostsByUsername",
  async (username, thunkAPI) => {
    try {
      const response = await clientServer.get(
        `/post/username/${encodeURIComponent(username)}`,
      );

      return response.data.posts;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch posts",
      );
    }
  },
);

export const getPostById = createAsyncThunk(
  "post/getPostById",
  async (postId, thunkAPI) => {
    try {
      const response = await clientServer.get(
        `/post/${encodeURIComponent(postId)}`,
      );

      return response.data.post;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch post",
      );
    }
  },
);
