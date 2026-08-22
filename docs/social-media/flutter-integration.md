# Integracion con Flutter — Modulo Social

## Configuracion Base

Asegurate de que el cliente HTTP base apunte al backend:

```dart
const baseUrl = 'https://tu-backend.example.com';
```

Todas las rutas del modulo social estan bajo `/posts` y `/feed`.

---

## Modelos (Dart)

### PostModel

```dart
class PostModel {
  final String id;
  final String content;
  final BookRef? book;
  final AuthorRef author;
  final int likesCount;
  final bool likedByMe;
  final int commentsCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  PostModel({
    required this.id,
    required this.content,
    this.book,
    required this.author,
    required this.likesCount,
    required this.likedByMe,
    required this.commentsCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['id'] as String,
      content: json['content'] as String,
      book: json['book'] != null
          ? BookRef.fromJson(json['book'] as Map<String, dynamic>)
          : null,
      author: AuthorRef.fromJson(json['author'] as Map<String, dynamic>),
      likesCount: json['likesCount'] as int,
      likedByMe: json['likedByMe'] as bool,
      commentsCount: json['commentsCount'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class BookRef {
  final String id;
  final String title;

  BookRef({required this.id, required this.title});

  factory BookRef.fromJson(Map<String, dynamic> json) {
    return BookRef(
      id: json['id'] as String,
      title: json['title'] as String,
    );
  }
}

class AuthorRef {
  final String id;
  final String username;

  AuthorRef({required this.id, required this.username});

  factory AuthorRef.fromJson(Map<String, dynamic> json) {
    return AuthorRef(
      id: json['id'] as String,
      username: json['username'] as String,
    );
  }
}
```

### CommentModel

```dart
class CommentModel {
  final String id;
  final String content;
  final AuthorRef author;
  final DateTime createdAt;
  final DateTime updatedAt;

  CommentModel({
    required this.id,
    required this.content,
    required this.author,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as String,
      content: json['content'] as String,
      author: AuthorRef.fromJson(json['author'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
```

### PaginatedResponse (generico)

```dart
class PaginatedResponse<T> {
  final List<T> data;
  final PaginationMeta meta;

  PaginatedResponse({required this.data, required this.meta});

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedResponse(
      data: (json['data'] as List)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>),
    );
  }
}

class PaginationMeta {
  final int total;
  final int page;
  final int pageSize;
  final int totalPages;
  final int lastPage;

  PaginationMeta({
    required this.total,
    required this.page,
    required this.pageSize,
    required this.totalPages,
    required this.lastPage,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      total: json['total'] as int,
      page: json['page'] as int,
      pageSize: json['pageSize'] as int,
      totalPages: json['totalPages'] as int,
      lastPage: json['lastPage'] as int,
    );
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}
```

---

## Servicio API

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class SocialApiService {
  final String baseUrl;
  final String? authToken;

  SocialApiService({required this.baseUrl, this.authToken});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  // ── Posts ──

  Future<PostModel> getPost(String postId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/posts/$postId'),
      headers: _headers,
    );
    return PostModel.fromJson(jsonDecode(response.body));
  }

  Future<PaginatedResponse<PostModel>> listPosts({
    int page = 1,
    int pageSize = 20,
    String? userId,
    String? bookId,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };
    if (userId != null) params['userId'] = userId;
    if (bookId != null) params['bookId'] = bookId;

    final response = await http.get(
      Uri.parse('$baseUrl/posts').replace(queryParameters: params),
      headers: _headers,
    );
    return PaginatedResponse.fromJson(
      jsonDecode(response.body),
      PostModel.fromJson,
    );
  }

  Future<PostModel> createPost({
    required String content,
    String? bookId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts'),
      headers: _headers,
      body: jsonEncode({
        'content': content,
        if (bookId != null) 'bookId': bookId,
      }),
    );
    return PostModel.fromJson(jsonDecode(response.body));
  }

  Future<PostModel> updatePost(String postId, {required String content}) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/posts/$postId'),
      headers: _headers,
      body: jsonEncode({'content': content}),
    );
    return PostModel.fromJson(jsonDecode(response.body));
  }

  Future<void> deletePost(String postId) async {
    await http.delete(
      Uri.parse('$baseUrl/posts/$postId'),
      headers: _headers,
    );
  }

  // ── Likes ──

  Future<void> likePost(String postId) async {
    await http.post(
      Uri.parse('$baseUrl/posts/$postId/like'),
      headers: _headers,
    );
  }

  Future<void> unlikePost(String postId) async {
    await http.delete(
      Uri.parse('$baseUrl/posts/$postId/like'),
      headers: _headers,
    );
  }

  // ── Comments ──

  Future<CommentModel> createComment(String postId, {required String content}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts/$postId/comments'),
      headers: _headers,
      body: jsonEncode({'content': content}),
    );
    return CommentModel.fromJson(jsonDecode(response.body));
  }

  Future<PaginatedResponse<CommentModel>> listComments(
    String postId, {
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/posts/$postId/comments').replace(
        queryParameters: {'page': page.toString(), 'pageSize': pageSize.toString()},
      ),
      headers: _headers,
    );
    return PaginatedResponse.fromJson(
      jsonDecode(response.body),
      CommentModel.fromJson,
    );
  }

  Future<CommentModel> updateComment(String commentId, {required String content}) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/comments/$commentId'),
      headers: _headers,
      body: jsonEncode({'content': content}),
    );
    return CommentModel.fromJson(jsonDecode(response.body));
  }

  Future<void> deleteComment(String commentId) async {
    await http.delete(
      Uri.parse('$baseUrl/comments/$commentId'),
      headers: _headers,
    );
  }

  // ── Feed ──

  Future<PaginatedResponse<PostModel>> getFeed({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/feed').replace(
        queryParameters: {'page': page.toString(), 'pageSize': pageSize.toString()},
      ),
      headers: _headers,
    );
    return PaginatedResponse.fromJson(
      jsonDecode(response.body),
      PostModel.fromJson,
    );
  }
}
```

---

## Integracion con Paginacion

El backend devuelve paginacion estandar. Para implementar scroll infinito en Flutter:

```dart
class PostListViewModel extends ChangeNotifier {
  final SocialApiService _api;
  
  List<PostModel> _posts = [];
  int _currentPage = 1;
  bool _hasNextPage = true;
  bool _isLoading = false;

  List<PostModel> get posts => _posts;
  bool get isLoading => _isLoading;
  bool get hasNextPage => _hasNextPage;

  Future<void> loadPosts() async {
    if (_isLoading) return;
    _isLoading = true;
    notifyListeners();

    final result = await _api.getFeed(page: _currentPage);
    _posts = result.data;
    _hasNextPage = result.meta.hasNextPage;
    _currentPage++;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadMore() async {
    if (_isLoading || !_hasNextPage) return;
    _isLoading = true;
    notifyListeners();

    final result = await _api.getFeed(page: _currentPage);
    _posts.addAll(result.data);
    _hasNextPage = result.meta.hasNextPage;
    _currentPage++;
    _isLoading = false;
    notifyListeners();
  }
}
```

---

## Estrategia de Cache

Para mejorar la UX, se recomienda:

1. **Cache de feed**: mantener los posts cargados en memoria mientras el usuario navega. Invalidar al hacer pull-to-refresh.

2. **Optimistic updates para likes**: al tocar el corazon, actualizar inmediatamente el estado en la UI (`likedByMe = true`, `likesCount + 1`) y hacer la llamada API en background. Si falla, revertir.

```dart
Future<void> toggleLike(PostModel post) async {
  // Optimistic update
  final index = _posts.indexWhere((p) => p.id == post.id);
  _posts[index] = post.copyWith(
    likedByMe: !post.likedByMe,
    likesCount: post.likedByMe ? post.likesCount - 1 : post.likesCount + 1,
  );
  notifyListeners();

  try {
    if (post.likedByMe) {
      await _api.unlikePost(post.id);
    } else {
      await _api.likePost(post.id);
    }
  } catch (e) {
    // Revert on error
    _posts[index] = post;
    notifyListeners();
  }
}
```

3. **Cache de comentarios**: mantener los comentarios cargados por post. No necesitan cache persistente ya que se recargan al abrir el post.

---

## Notas de Integracion

###userId

El backend actualmente usa un userId stub hardcodeado. Cuando se implemente JWT:

1. El `SocialApiService` debe enviar el token en el header `Authorization: Bearer <token>`
2. El backend reemplazara el stub por el userId real del token
3. Los campos `likedByMe` y las validaciones de propietario funcionaran automaticamente

### Pagination query params

El backend soporta los siguientes parametros de query:

| Parametro | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `page` | int | 1 | Numero de pagina |
| `pageSize` | int | 20 | Elementos por pagina (max 100) |
| `filters` | String | - | Filtros, ej: `userId==abc` |
| `sorts` | String | - | Orden, ej: `createdAt:desc` |
| `userId` | String | - | Filtrar por usuario (posts/feed) |
| `bookId` | String | - | Filtrar por libro (posts/feed) |

### Filtros para el feed de un usuario

```dart
// Posts de un usuario especifico
await api.listPosts(userId: 'user-uuid');

// Posts de un libro especifico
await api.listPosts(bookId: 'book-uuid');

// Feed general ordenado por fecha
await api.getFeed();
```

### Manejo de errores

El backend devuelve errores en formato estandar NestJS:

```json
{
  "statusCode": 404,
  "message": "Post with id \"...\" not found.",
  "error": "Not Found"
}
```

En Flutter, capturar los codigos de respuesta:

```dart
try {
  final post = await api.getPost(postId);
} on http.ClientException catch (e) {
  // Error de conexion
} catch (e) {
  if (e is http.Response) {
    if (e.statusCode == 404) {
      // Post no encontrado
    } else if (e.statusCode == 403) {
      // No eres propietario
    }
  }
}
```

### Soft delete en la UI

Cuando un usuario elimina un post o comentario:
1. El backend marca `deletedAt` (no borra fisicamente)
2. La UI debe remover el item de la lista local inmediatamente
3. En la proxima carga, el item no aparecera (filtrado por `deletedAt IS NULL`)

No hay necesidad de manejar restauracion en el MVP.