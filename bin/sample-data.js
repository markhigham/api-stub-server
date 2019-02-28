"use strict";

function getSampleData() {
  return [
    {
      count: 5,
      method: "get",
      body: {
        text: "This matches against /api/value/1 or /api/value/xyx",
        timestamp: "Number of ticks since app started {{$ticks}}",
        count: "How many times this url was called {{$count}}",
        uid: "A node uuidv4  - {{$uid}}"
      },
      url: "/api/value/:id",
      usageType: "persistent",
      uid: "ecb56d59-1774-4465-8ce0-b308df6a1948"
    },
    {
      count: 1,
      method: "post",
      body: {},
      url: "/api/value",
      usageType: "persistent",
      uid: "a04f0e16-fd70-497d-b594-98746d9e2b6e"
    }
  ];
}

module.exports = getSampleData;
