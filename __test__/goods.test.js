const chai = require("chai");
const chaiHttp = require("chai-http");

const expect = chai.expect;

chai.use(chaiHttp);

const app = require("../app");
const {
  users,
  q_lists,
  reply,
  reviews,
  goods,
  order_lists,
} = require("../models");
const goodsFixtures = require("./fixtures/goods.json");
const review = require("../controllers/goods/review");
const { agent } = require("supertest");

describe("Goods Test Case", () => {
  beforeEach(async () => {
    // Setup/TearDown : Check Fixtures folder
    await goods.destroy({ where: {}, truncate: true });
    await goods.create(goodsFixture[0]);
    await goods.create(goodsFixture[1]);
  });

  describe("GET/goods/lists", () => {
    it("검색 요청 시 조건에 맞는 제품의 목록을 응답해야 합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/lists")
        .query({ min: 1000, max: 50000 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(200);
          res.body.forEach((data_val, index) => {
            expect(data_val).has.all.keys([
              "goods_id",
              "goods_name",
              "goods_img",
              "goods_price",
            ]);
          });
          done();
        });
    });
    it("검색 요청 시 조건에 맞는 제품이 존재하지 않을 경우 없다는 메세지를 응답해야 합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/lists")
        .query({ min: 50000 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal("검색 결과가 없습니다.");
          done();
        });
    });
  });
  describe("GET/goods/Info", () => {
    it("특정 제품의 상세정보를 응답해야 합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info")
        .query({ goods_id: 1 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }

          expect(res).to.have.status(200);
          expect(res.body).has.all.keys([
            "goods_name",
            "goods_img",
            "goods_price",
            "info_img",
          ]);

          done();
        });
    });

    it("해당 정보가 없으면 제품이 없다는 응답을 해야합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info")
        .query({ goods_id: 5 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal("해당 제품 정보가 없습니다.");

          done();
        });
    });
  });
  describe("GET/goods/info/qa_lists", () => {
    it("해당 제품과 관련된 질문의 목록을 응답해야 합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info/qa_lists")
        .send({ goods_id: 1 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(200);
          res.body.forEach((data_val, index) => {
            expect(data_val).has.all.keys([
              "id",
              "title",
              "username",
              "contents",
              "reply",
            ]);
          });
          done();
        });
    });
    it("해당 제품과 관련된 질문이 없을 경우 없다는 응답을 해야합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info/qa_lists")
        .send({ goods_id: 2 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal("질문이 존재하지 않습니다.");

          done();
        });
    });
  });
  describe("POST/goods/qa_lists", () => {
    it("해당 제품과 관련된 질문이 요청으로 오면 데이터베이스에 저장해야 합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/qa_lists")
            .send({ title: "hello", contents: "it's awesome", goods_id: 1 })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              q_lists
                .findOne({
                  where: {
                    title: "hello",
                    contents: "it's awesome",
                    goods_id: 1,
                  },
                })
                .then((data) => {
                  if (data) {
                    expect(res).to.have.status(200);
                    expect(res.body.message).to.equal(
                      "성공적으로 글이 작성 되었습니다."
                    );
                  }
                });
              done();
            });
        });
    });
    it("질문에 text가 없을 경우 에러메세지를 응답해야합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/qa_lists")
            .send({ title: "hello", goods_id: 1 })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res).to.have.status(404);
              expect(res.body.message).to.equal("내용이 없습니다.");
              done();
            });
        });
    });
  });
  describe("POST/goods/reply", () => {
    it("질문에 대한 리플이 요청으로 오면 데이터베이스에 저장해야 합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/reply")
            .send({ text: "yes!", qa_list_id: 1 })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              reply
                .findOne({
                  where: {
                    text: "yes!",
                    qa_list_id: 1,
                  },
                })
                .then((data) => {
                  if (data) {
                    expect(res).to.have.status(200);
                    expect(res.body.message).to.equal("리플 성공");
                  }
                });
              done();
            });
        });
    });
    it("질문에 text가 없을 경우 에러메세지를 응답해야합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/reply")
            .send({ qa_list_id: 1 })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res).to.have.status(404);
              expect(res.body.message).to.equal("리플 실패");
              done();
            });
        });
    });
  });
  describe("GET/goods/info/review", () => {
    it("해당 제품과 관련된 리뷰를 응답해야 합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info/review")
        .send({ goods_id: 1 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(200);
          res.body.forEach((data_val, index) => {
            expect(data_val).has.all.keys([
              "title",
              "username",
              "contents",
              "star",
              "review_img",
            ]);
          });
          done();
        });
    });
    it("해당 제품과 관련된 리뷰가 없을 경우 없다는 응답을 해야합니다.", (done) => {
      chai
        .request(app)
        .get("/goods/info/review")
        .send({ goods_id: 2 })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }
          expect(res).to.have.status(404);
          expect(res.body.message).to.equal("리뷰가 존재하지 않습니다.");

          done();
        });
    });
  });
  describe("POST/goods/info/review", () => {
    it("리뷰가 요청으로 오면 데이터베이스에 저장해야 합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/review")
            .send({
              review_img: "file",
              title: "hello",
              username: "coco",
              contents: "It is good bro!",
              star: 4,
              review_img: "file",
            })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              reviews
                .findOne({
                  where: {
                    review_img: "file",
                    title: "hello",
                    username: "coco",
                    contents: "It is good bro!",
                    star: 4,
                    review_img: "file",
                  },
                })
                .then((data) => {
                  if (data) {
                    expect(res).to.have.status(200);
                    expect(res.body.message).to.equal(
                      "성공적으로 글이 작성 되었습니다."
                    );
                  }
                });
              done();
            });
        });
    });
    it("리뷰에 text가 없을 경우 에러메세지를 응답해야합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/review")
            .send({
              review_img: "file",
              title: "hello",
              username: "coco",
              star: 4,
              review_img: "file",
            })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res).to.have.status(404);
              expect(res.body.message).to.equal("내용이 없습니다.");
              done();
            });
        });
    });
  });
  describe("POST/goods/registration", () => {
    it("판매자가 상품을 저장하면 데이터베이스에 저장해야 합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          const agent = chai.request.agent(app);
          agent
            .request(app)
            .post("/goods/registration")
            .send({
              goods_name: "freesia",
              goods_img: "file",
              goods_price: 13000,
              stock: 20,
              info_img: "file",
            })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              goods
                .findOne({
                  where: {
                    goods_name: "freesia",
                    goods_img: "file",
                    goods_price: 13000,
                    stock: 20,
                    info_img: "file",
                  },
                })
                .then((data) => {
                  if (data) {
                    expect(res).to.have.status(200);
                    expect(res.body.message).to.equal(
                      "정상적으로 상품이 등록 되었습니다."
                    );
                  }
                });
              done();
            });
        });
    });
    it("상품 등록에 실패했을 경우 에러메세지를 응답해야합니다.", (done) => {
      const agent = chai.request.agent(app);
      agent
        .request(app)
        .post("/user/login")
        .send({ email: "coco@naver.com", password: "1234" })
        .then(() => {
          agent
            .request(app)
            .post("/goods/info/review")
            .send({
              goods_name: "freesia",
              goods_price: 13000,
              stock: 20,
              info_img: "file",
            })
            .end((err, res) => {
              if (err) {
                done(err);
                return;
              }
              expect(res).to.have.status(404);
              expect(res.body.message).to.equal("상품 등록이 실패 되었습니다.");
              done();
            });
        });
    });
  });
});