import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const isLocal = !!process.env.SFN_ENDPOINT;

const stepFunctionsClient = new SFNClient({
  region: process.env.AWS_REGION || "us-west-2",
  ...(isLocal && {
    endpoint: process.env.SFN_ENDPOINT,
    credentials: {
      accessKeyId: "dummy",
      secretAccessKey: "dummy"
    }
  })
});

const stepFunctionArn = process.env.CONTACT_MATCH_SFN_ARN;

const strategyMatchers = [
  {
    id: "asurite",
    required: ["asurite"]
  },
  {
    id: "firstname_email",
    required: ["firstname", "email"]
  },
  {
    id: "name_birthdate_postalcode",
    required: ["firstname", "lastname", "birthdate", "postalcode"]
  },
  {
    id: "name_phone",
    required: ["firstname", "lastname", "phone"]
  },
  {
    id: "name_address",
    required: ["firstname", "lastname", "postalcode", "street"]
  }
];

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const matchedPaths = [];

  for (const matcher of strategyMatchers) {
    const hasAll = matcher.required.every((key) => queryParams[key]);
    if (hasAll) matchedPaths.push(matcher.id);
  }

  if (matchedPaths.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing valid parameter combination. Refer to /contact documentation."
      })
    };
  }

  const client = stepFunctionsClient;

  const input = {
    matchedPaths,
    queryParams
  };

  const command = new StartExecutionCommand({
    stateMachineArn: stepFunctionArn,
    input: JSON.stringify(input)
  });

  try {
    const response = await client.send(command);
    return {
      statusCode: 202,
      body: JSON.stringify({
        message: "Contact matching started.",
        executionArn: response.executionArn
      })
    };
  } catch (err) {
    console.error("Step Function execution failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal error starting contact match" })
    };
  }
};
