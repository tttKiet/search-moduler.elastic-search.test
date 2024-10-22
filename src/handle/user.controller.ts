import { Client } from "@elastic/elasticsearch";
import type { Context } from "hono";

const client = new Client({
  node: "http://localhost:9200",
});

interface IUser {
  profile: {
    displayName: string;
    displayName_nor?: string | undefined;
    avatar: string;
    originalAvatar: string;
  };
}
const removeDiacritics = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const users: IUser[] = [
  {
    profile: {
      displayName: "Mỹ Hạnh",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "Ha",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "hân",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },

  {
    profile: {
      displayName: "diễm",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "Diêm",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },

  {
    profile: {
      displayName: "My",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
];

const userBuiks = users.map((u) => ({
  ...u,
  profile: {
    ...u.profile,
    displayName_nor: removeDiacritics(u.profile.displayName),
  },
}));

const createIndex = async (c: Context) => {
  const { index_name } = await c.req.json();
  const res = await client.indices.create({
    index: index_name,
    settings: {
      analysis: {
        analyzer: {
          custom_analyzer_utf8: {
            type: "custom",
            tokenizer: "whitespace",
            filter: ["lowercase", "asciifolding"],
          },
          custom_analyzer_lowercase: {
            type: "custom",
            tokenizer: "whitespace",
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
        },
        "profile.displayName_nor": {
          type: "text",
          analyzer: "custom_analyzer_utf8",
        },
      },
    },
  });
  return c.json({ ok: 200, message: "Successfully", data: res }, 200);
};

const createUser = async (c: Context) => {
  try {
    const res = await client.helpers.bulk({
      datasource: userBuiks,
      onDocument(doc) {
        console.log("doc int onDocument: ", doc);
        return { index: { _index: "data_user_profile" } };
      },
    });
    console.log("res: client.index: ", res);

    return c.json(
      { ok: 200, message: "User created successfully", data: res },
      200
    );
  } catch (error) {
    console.error("Elasticsearch error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
};

const catAllIndex = async (c: Context) => {
  try {
    const res = await client.cat.indices({
      format: "json",
    });
    console.log("res: client.index: ", res);

    return c.json(
      { ok: 200, message: "User created successfully", data: res },
      200
    );
  } catch (error) {
    console.error("Elasticsearch error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
};

const getDataFromIndex = async (c: Context) => {
  const { name } = c.req.queries();
  console.log("name: ", name);
  if (!name) {
    return c.json({ ok: 200, message: "err" }, 400);
  }
  try {
    const res = await client.search({
      index: name,
      query: {
        match_all: {},
      },
    });
    console.log("res: client.index: ", res);

    return c.json({ ok: 200, message: "Successfully", data: res }, 200);
  } catch (error) {
    console.error("Elasticsearch error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
};

/* 
  Tuan Kiet
*/
const hasAccent = (str: string): boolean => {
  // eslint-disable-next-line no-control-regex
  return /[^\u0000-\u007F]/.test(str);
};

const handleSearchName = async (c: Context) => {
  const { name: asName, index } = c.req.query();
  const name = asName.toLocaleLowerCase().trim();
  try {
    let res;
    if (hasAccent(name)) {
      res = await client.search({
        index: index,
        query: {
          // match: {
          //   "profile.displayName": {
          //     query: name,
          //   },
          // },
          prefix: {
            "profile.displayName": {
              value: name,
            },
          },
        },
        size: 100,
      });
      console.log("res: client.index have accent: ", res);
      return c.json({ ok: 200, message: "Successfully have accent", res }, 200);
    } else {
      res = await client.search({
        index: index,
        query: {
          // match: {
          //   "profile.displayName_nor": {
          //     query: name,
          //   },
          // },
          prefix: {
            "profile.displayName_nor": {
              value: name,
            },
          },
        },
        size: 100,
      });
      console.log("res: client.index: ", res);
      return c.json({ ok: 200, message: "Successfully no accent", res }, 200);
    }
  } catch (error) {
    console.error("Elasticsearch error:", error);
  }
};

export {
  createUser,
  handleSearchName,
  catAllIndex,
  getDataFromIndex,
  createIndex,
};
