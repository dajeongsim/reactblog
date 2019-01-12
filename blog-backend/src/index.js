require('dotenv').config();

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
const session = require('koa-session');

const api = require('./api');

const {
  PORT: port = 4000, // 값이 존재하지 않는다면 4000을 기본 값으로 사용
  MONGO_URI: mongoURI,
  COOKIE_SIGN_KEY: signKey
} = process.env;

mongoose.Promise = global.Promise; // Node의 Promise를 사용하도록 설정
mongoose.connect(mongoURI).then(() => {
  console.log('connected to mongodb');
}).catch((e) => {
  console.error(e);
});

const app = new Koa();
const router = new Router();

// 라우터 설정
// router.get('/', (ctx) => {
//   ctx.body = '홈';
// });
//
// router.get('/about/:name?', (ctx) => {
//   const { name } = ctx.params;
//
//   ctx.body = name ? `${name}의 소개` : '소개';
// });
//
// router.get('/posts', (ctx) => {
//   const { id } = ctx.query;
//
//   ctx.body = id ? `포스트 #${id}` : '포스트 아이디가 없습니다.';
// });
router.use('/api', api.routes()); // api 라우트 적용

// 라우터 적용 전에 bodyParser 적용
app.use(bodyParser());

// 세션/키 적용
const sessionConfig = {
  maxAge: 86400000, // 하루
  // signed: true (기본으로 설정되어 있음)
}

app.use(session(sessionConfig, app));
app.keys = [signKey];

// app 인스턴스에 라우터 적용
app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log('listening to port', port);
});
