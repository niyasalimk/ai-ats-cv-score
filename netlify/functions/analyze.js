// This is a simple test function.

exports.handler = async function (event) {

  // This is the only thing the function will do.
  console.log("Hello from the test function!");

  const responseBody = {
    message: "Function was called successfully!",
    receivedBody: event.body
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody),
  };
};
