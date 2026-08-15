const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = "https://restful-booker.herokuapp.com";

const defaultBooking = {
  firstname: "Jim",
  lastname: "Brown",
  totalprice: 111,
  depositpaid: true,
  bookingdates: {
    checkin: "2026-08-20",
    checkout: "2026-08-25",
  },
  additionalneeds: "Breakfast",
};

async function createToken() {
  const response = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "admin",
      password: "password123",
    }),
  });

  assert.strictEqual(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);

  const data = await response.json();

  assert.ok(data.token);
  assert.strictEqual(typeof data.token, "string");

  return data.token;
}

async function createBooking(payload) {
  const response = await fetch(`${BASE_URL}/booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  assert.strictEqual(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);

  const data = await response.json();

  assert.ok(data.bookingid);
  assert.ok(data.booking);

  return data.bookingid;
}

async function getBooking(bookingId) {
  const response = await fetch(`${BASE_URL}/booking/${bookingId}`);

  return response;
}

async function updateBooking(bookingId, token, payload) {
  const response = await fetch(`${BASE_URL}/booking/${bookingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}

async function deleteBooking(bookingId, token) {
  const response = await fetch(`${BASE_URL}/booking/${bookingId}`, {
    method: "DELETE",
    headers: {
      Cookie: `token=${token}`,
    },
  });

  return response;
}

test("Booking E2E flow: create token, create-get-update-delete booking", async () => {
  const token = await createToken();

  const bookingId = await createBooking(defaultBooking);

  const getResponse = await getBooking(bookingId);

  assert.strictEqual(getResponse.status, 200);
  assert.match(getResponse.headers.get("content-type"), /application\/json/);

  const bookingData = await getResponse.json();

  assert.strictEqual(bookingData.firstname, defaultBooking.firstname);
  assert.strictEqual(bookingData.lastname, defaultBooking.lastname);
  assert.strictEqual(bookingData.totalprice, defaultBooking.totalprice);
  assert.strictEqual(bookingData.depositpaid, defaultBooking.depositpaid);
  assert.strictEqual(
    bookingData.additionalneeds,
    defaultBooking.additionalneeds,
  );

  const updatedBooking = { ...defaultBooking, firstname: "James" };
  const updateResponse = await updateBooking(bookingId, token, updatedBooking);

  assert.strictEqual(updateResponse.status, 200);
  assert.match(updateResponse.headers.get("content-type"), /application\/json/);

  const updateData = await updateResponse.json();

  assert.strictEqual(updateData.firstname, "James");
  assert.strictEqual(updateData.lastname, defaultBooking.lastname);
  assert.strictEqual(updateData.totalprice, defaultBooking.totalprice);
  assert.strictEqual(updateData.depositpaid, defaultBooking.depositpaid);
  assert.strictEqual(
    updateData.additionalneeds,
    defaultBooking.additionalneeds,
  );

  const deleteResponse = await deleteBooking(bookingId, token);

  assert.strictEqual(deleteResponse.status, 201);

  const verifyResponse = await getBooking(bookingId);

  assert.strictEqual(verifyResponse.status, 404);
});
