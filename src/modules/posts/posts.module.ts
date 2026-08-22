import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { POST_REPOSITORY } from './domain/post.repository';
import { POST_LIKE_REPOSITORY } from './domain/post-like.repository';
import { COMMENT_REPOSITORY } from './domain/comment.repository';
import { CreatePostEndpoint } from './features/create-post/create-post.endpoint';
import { CreatePostHandler } from './features/create-post/create-post.handler';
import { GetPostEndpoint } from './features/get-post/get-post.endpoint';
import { GetPostHandler } from './features/get-post/get-post.handler';
import { ListPostsEndpoint } from './features/list-posts/list-posts.endpoint';
import { ListPostsHandler } from './features/list-posts/list-posts.handler';
import { UpdatePostEndpoint } from './features/update-post/update-post.endpoint';
import { UpdatePostHandler } from './features/update-post/update-post.handler';
import { DeletePostEndpoint } from './features/delete-post/delete-post.endpoint';
import { DeletePostHandler } from './features/delete-post/delete-post.handler';
import { LikePostEndpoint } from './features/like-post/like-post.endpoint';
import { LikePostHandler } from './features/like-post/like-post.handler';
import { UnlikePostEndpoint } from './features/unlike-post/unlike-post.endpoint';
import { UnlikePostHandler } from './features/unlike-post/unlike-post.handler';
import { CreateCommentEndpoint } from './features/create-comment/create-comment.endpoint';
import { CreateCommentHandler } from './features/create-comment/create-comment.handler';
import { ListCommentsEndpoint } from './features/list-comments/list-comments.endpoint';
import { ListCommentsHandler } from './features/list-comments/list-comments.handler';
import { UpdateCommentEndpoint } from './features/update-comment/update-comment.endpoint';
import { UpdateCommentHandler } from './features/update-comment/update-comment.handler';
import { DeleteCommentEndpoint } from './features/delete-comment/delete-comment.endpoint';
import { DeleteCommentHandler } from './features/delete-comment/delete-comment.handler';
import { GetFeedEndpoint } from './features/get-feed/get-feed.endpoint';
import { GetFeedHandler } from './features/get-feed/get-feed.handler';
import { PrismaPostRepository } from './infrastructure/persistence/prisma/prisma-post.repository';
import { PrismaPostLikeRepository } from './infrastructure/persistence/prisma/prisma-post-like.repository';
import { PrismaCommentRepository } from './infrastructure/persistence/prisma/prisma-comment.repository';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreatePostEndpoint,
    GetPostEndpoint,
    ListPostsEndpoint,
    UpdatePostEndpoint,
    DeletePostEndpoint,
    LikePostEndpoint,
    UnlikePostEndpoint,
    CreateCommentEndpoint,
    ListCommentsEndpoint,
    UpdateCommentEndpoint,
    DeleteCommentEndpoint,
    GetFeedEndpoint,
  ],
  providers: [
    {
      provide: POST_REPOSITORY,
      useClass: PrismaPostRepository,
    },
    {
      provide: POST_LIKE_REPOSITORY,
      useClass: PrismaPostLikeRepository,
    },
    {
      provide: COMMENT_REPOSITORY,
      useClass: PrismaCommentRepository,
    },
    CreatePostHandler,
    GetPostHandler,
    ListPostsHandler,
    UpdatePostHandler,
    DeletePostHandler,
    LikePostHandler,
    UnlikePostHandler,
    CreateCommentHandler,
    ListCommentsHandler,
    UpdateCommentHandler,
    DeleteCommentHandler,
    GetFeedHandler,
  ],
})
export class PostsModule {}
