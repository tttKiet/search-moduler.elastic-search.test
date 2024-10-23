import { Client } from "@elastic/elasticsearch";
import type { Context } from "hono";
import {
  createIndexService,
  createUserService,
  getDataFromIndexService,
  handleSearchNameService,
} from "./user.service..ts";

const client = new Client({
  node: "http://localhost:9200",
});

export interface IUser {
  profile: {
    displayName: string;
    displayName_nor?: string | undefined;
    avatar: string;
    originalAvatar: string;
  };
}
export const removeDiacritics = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const users: IUser[] = [
  {
    profile: {
      displayName: "Bùi Tuấn Kiệt",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "Bui",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "Kiệt",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },

  {
    profile: {
      displayName: "Tuấn",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "Tuân",
      avatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
      originalAvatar:
        "https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/32.jpg",
    },
  },
  {
    profile: {
      displayName: "tuan",
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
  const res = await createIndexService(index_name);

  return c.json({ ok: 200, message: "Successfully", data: res }, 200);
};

const createUser = async (c: Context) => {
  try {
    const res = await createUserService(userBuiks);
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
  const { name } = c.req.query();
  console.log("name: ", name);
  if (!name) {
    return c.json({ ok: 200, message: "err" }, 400);
  }
  try {
    const res = await getDataFromIndexService(name);
    return c.json({ ok: 200, message: "Successfully", data: res }, 200);
  } catch (error) {
    console.error("Elasticsearch error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
};

/* 
  Tuan Kiet
*/

const handleSearchName = async (c: Context) => {
  const { name: asName, index } = c.req.query();
  const name = asName.toLocaleLowerCase().trim();
  try {
    const res = await handleSearchNameService({ index, name });
    console.log(res);

    return c.json({ ok: 200, message: "Successfully no accent", res }, 200);
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
