import { Client } from "@elastic/elasticsearch";
import type { IUser } from "./user.controller.ts";

const client = new Client({
  node: "http://localhost:9200",
});

const createIndexService = async (index_name: string) => {
  const res = await client.indices.create({
    index: index_name,
    settings: {
      analysis: {
        analyzer: {
          custom_analyzer_utf8: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase", "asciifolding"],
          },
          custom_analyzer_lowercase: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase"],
          },
        },
      },
    },
    mappings: {
      properties: {
        "profile.displayName": {
          type: "text",
          analyzer: "custom_analyzer_lowercase",
          search_analyzer: "custom_analyzer_lowercase",
        },
        "profile.displayName_nor": {
          type: "text",
          analyzer: "custom_analyzer_utf8",
          search_analyzer: "custom_analyzer_utf8",
        },
      },
    },
  });

  return res;
};

const createUserService = async (userBuiks: IUser[], index_name?: string) => {
  const res = await client.helpers.bulk({
    datasource: userBuiks,
    onDocument(doc) {
      console.log("doc int onDocument: ", doc);
      return { index: { _index: index_name || "data_user_profile" } };
    },
  });
  console.log("-----------------------------------res: ", res);

  return res;
};

const getDataFromIndexService = async (name: string) => {
  const res = await client.search({
    index: name,
    query: {
      match_all: {},
    },
  });
  console.log("res: client.index: ", res);
  return res;
};

const hasAccent = (str: string): boolean => {
  // eslint-disable-next-line no-control-regex
  return /[^\u0000-\u007F]/.test(str);
};

const handleSearchNameService = async ({
  name: asName,
  index,
}: {
  name: string;
  index: string;
}) => {
  const name = asName.toLocaleLowerCase().trim();
  let res;
  console.log("-----------------------name test => ", name);

  if (hasAccent(name)) {
    res = await client.search({
      index: index,
      query: {
        match_phrase_prefix: {
          "profile.displayName": name,
        },
      },
      size: 100,
    });
    console.log("----------------handleSearchNameService have accent", res);

    return res;
  } else {
    res = await client.search({
      index: index,
      query: {
        match_phrase_prefix: {
          "profile.displayName_nor": name,
        },
      },
      size: 100,
    });

    console.log("----------------handleSearchNameService no accent", res);
    return res;
  }
};

export {
  createIndexService,
  createUserService,
  handleSearchNameService,
  getDataFromIndexService,
};
