import { beforeAll, describe, expect, test } from "@jest/globals";
import { Client } from "@elastic/elasticsearch";
import {
  createIndexService,
  createUserService,
  handleSearchNameService,
} from "../handle/user.service..ts";
import { users_test } from "./search.data.ts";
import { removeDiacritics, type IUser } from "../handle/user.controller.ts";
import type { SearchHit } from "@elastic/elasticsearch/lib/api/types.js";

const indexName = "test_users";

const userBuiks = users_test.map((u) => ({
  ...u,
  profile: {
    ...u.profile,
    displayName_nor: removeDiacritics(u.profile.displayName),
  },
}));

async function connect() {
  const client = new Client({
    node: "http://localhost:9200",
  });

  const _indexExited = await client.indices.exists({ index: indexName });

  if (_indexExited) {
    await client.indices.delete({ index: indexName });
  }

  await createIndexService(indexName);
  await createUserService(userBuiks, indexName);
}

beforeAll(async () => {
  // await connect();
});
describe("Search module", () => {
  test("Test 'châu'", async () => {
    // get all data in index
    // const resData = await getDataFromIndexService(indexName);
    //
    // console.log("-------------------> resData: ", resData);

    const res = await handleSearchNameService({
      name: "châu",
      index: indexName,
    });

    // console.log("=- res-resres----------------------: ", res);

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];
    // console.log("hits: ", { hits, length: hits.length });

    expect(hits.length).toEqual(2);

    // function compareStringHits() {
    //   return hits.every((e) => {
    //     const t = e._source?.profile.displayName;
    //     return t == "Bùi Tuấn Kiệt";
    //   });
    // }
  });

  test("Test 'LY THUONG KIET'", async () => {
    //Result: LY THUONG KIET, lý thường kiệt, viet quoc cong ly thuong kiet

    const res = await handleSearchNameService({
      name: "LY THUONG KIET",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "lý thường kiệt" || t == "viet quoc cong ly thuong kiet";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'CHÂU VĂN LIÊM'", async () => {
    const res = await handleSearchNameService({
      name: "CHÂU VĂN LIÊM",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "CHÂU VĂN LIÊM";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'phan boi chau'", async () => {
    //Result: phan boi chau, truong hoc phan boi chau, phan bội châu

    const res = await handleSearchNameService({
      name: "phan boi chau",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return (
          t == "phan boi chau" ||
          t == "truong hoc phan boi chau" ||
          t == "phan bội châu"
        );
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'ngô quyền'", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "ngô quyền",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "ngô quyền" || t == "vua ngô quyền";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'diêm'", async () => {
    // result: kh kq
    const res = await handleSearchNameService({
      name: "diêm",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    expect(hits.length).toEqual(0);
  });

  test("Test 'ngô quyền'", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "ngô quyền",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "ngô quyền" || t == "vua ngô quyền";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'ng'", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "ng",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return (
          t == "ngô đồng" ||
          t == "truong hoc ngo quyen" ||
          t == "vua ngô quyền" ||
          t == "Ngô Đình Diệm"
        );
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'thường k'", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "thường k",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "lý thường kiệt";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'ngo", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "ngo",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return (
          t == "ngô đồng" ||
          t == "vua ngô quyền" ||
          t == "Ngô Đình Diệm" ||
          t == "truong hoc ngo quyen"
        );
      });
    }
    expect(compareStringHits()).toEqual(true);
  });

  test("Test 'chấu", async () => {
    //Result: ngô quyền, vua ngô quyền

    const res = await handleSearchNameService({
      name: "chấu",
      index: indexName,
    });

    const hits: SearchHit<IUser>[] = res.hits.hits as SearchHit<IUser>[];

    function compareStringHits() {
      return hits.every((e) => {
        const t = e._source?.profile.displayName;
        return t == "châu chấu";
      });
    }
    expect(compareStringHits()).toEqual(true);
  });
});
