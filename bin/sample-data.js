"use strict";

const sampleData = [
  {
    count: 0,
    method: "get",
    body: {
      text: "This matches against /api/value/1 or /api/value/xyx",
      timestamp: "Current timestamp {{$ticks}}",
      count: "How many times this url was called {{$count}}",
      uid: "A node uuidv4  - {{$uid}}",
    },
    url: "/api/value/:id",
    usageType: "persistent",
    uid: "ecb56d59-1774-4465-8ce0-b308df6a1948",
  },
  {
    count: 0,
    method: "post",
    body: {},
    url: "/api/value",
    usageType: "persistent",
    uid: "a04f0e16-fd70-497d-b594-98746d9e2b6e",
  },
  {
    count: 0,
    method: "delete",
    body: {},
    url: "/api/value/:id",
    usageType: "single",
    uid: "d3425cfb-1e4b-4f4a-af3c-bdc52546c976",
  },
];

module.exports = sampleData;
