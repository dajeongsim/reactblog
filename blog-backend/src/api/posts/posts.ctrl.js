const Post = require('../../models/post');
const Joi = require('joi');
const { ObjectId } = require('mongoose').Types;

exports.checkLogin = (ctx, next) => {
  if(!ctx.session.logged) {
    ctx.status = 401; // Unauthorized
    return null;
  }
  return next();
}

exports.checkObjectId = (ctx, next) => {
  const { id } = ctx.params;

  // 검증 실패
  if(!ObjectId.isValid(id)) {
    ctx.status = 400; // 400 Bad request
    return null;
  }

  return next(); // next를 리턴해야 ctx.body가 제대로 설정 됨.
}

exports.write = async (ctx) => {
  // 객체가 지닌 값들을 검증
  const schema = Joi.object().keys({
    title: Joi.string().required(), // 뒤에 required를 붙이면 필수 항목이라는 의미
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required()
  });

  // 첫 번째 파라미터는 검증할 객체, 두 번째는 스키마
  const result = Joi.validate(ctx.request.body, schema);

  // 오류 발생시 오류 내용 응답
  if(result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { title, body, tags } = ctx.request.body;

  // 새 Post 인스턴스를 만듦.
  const post = new Post({
    title, body, tags
  });

  try {
    await post.save(); // 데이터베이스에 등록
    ctx.body = post; // 저장된 결과를 반환
  } catch (e) {
    // 데이터베이스에 오류 발생
    ctx.throw(e, 500);
  }
};

exports.list = async (ctx) => {
  // page가 주어지지 않았다면 1로 간주
  // query는 문자열 형태로 받아오므로 숫자로 변환
  const page = parseInt(ctx.query.page || 1, 10);
  const { tag } = ctx.query;

  const query = tag ? {
    tags: tag // tags 배열에 tag를 가진 포스트 찾기
  } : {};

  // 잘못된 페이지가 주어졌다면 오류
  if(page<1) {
    ctx.status = 400;
    return;
  }

  try {
    // sort({ 필드명: 1(오름차순) or -1(내림차순)})
    const posts = await Post.find(query)
      .sort({_id: -1})
      .limit(10)
      .skip((page-1)*10)
      .lean()
      .exec();

    const postCount = await Post.count(query).exec();
    const limitBodyLength = post => ({
      // ...post.toJSON(),
      ...post,
      body: post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}...`
    });
    ctx.body = posts.map(limitBodyLength);
    // 마지막 페이지 알려주기
    // ctx.set은 response header를 설정
    ctx.set('Last-Page', Math.ceil(postCount / 10)); // 10진수로 변환
  } catch (e) {
    ctx.throw(e, 500);
  }
};

exports.read = async (ctx) => {
  const { id } = ctx.params;
  try {
    const post = await Post.findById(id).exec();
    // 포스트가 존재하지 않는다.
    if(!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(e, 500);
  }
};

exports.remove = async (ctx) => {
  const { id } = ctx.params;
  try {
    // remove, findOneAndRemove 함수도 사용 가능
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204;
  } catch (e) {
    ctx.throw(e, 500);
  }
};

exports.update = async (ctx) => {
  const { id } = ctx.params;
  try {
    const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
      // 이 값을 설정해야 업데이트 된 객체를 반환함
      // 설정하지 않을 경우 업데이트 전의 객체를 반환
      // 포스트가 존재하지 않는다.
      new: true
    }).exec();
    if(!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(e, 500);
  }
};
