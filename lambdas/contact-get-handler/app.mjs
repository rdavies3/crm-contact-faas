import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from "@aws-sdk/client-sfn";

const stepFunctionArn = process.env.CONTACT_MATCH_SFN_ARN;
const awsRegion = process.env.AWS_REGION;

const stepFunctionsClient = new SFNClient({ region: awsRegion });

const strategyMatchers = [
  { id: "asurite", required: ["asurite"] },
  { id: "firstname_email", required: ["firstname", "email"] },
  { id: "name_birthdate_postalcode", required: ["firstname", "lastname", "birthdate", "postalcode"] },
  { id: "name_phone", required: ["firstname", "lastname", "phone"] },
  { id: "name_address", required: ["firstname", "lastname", "postalcode", "street"] }
  { id: "nameshort_phone", required: ["firstname", "lastname", "phone"] }
  { id: "nameshort_birthdate_postalcode", required: ["firstname", "lastname", "birthdate", "postalcode"] },
  { id: "nameshort_addressshort", required: ["firstname", "lastname", "postalcode", "street"] }
];

const waitForExecution = async (executionArn) => {
  let status = "RUNNING";
  let output;

  while (status === "RUNNING") {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await stepFunctionsClient.send(
      new DescribeExecutionCommand({ executionArn })
    );

    status = result.status;
    if (status === "SUCCEEDED") {
      output = result.output;
    } else if (status === "FAILED" || status === "TIMED_OUT" || status === "ABORTED") {
      throw new Error(`Step Function execution failed with status: ${status}`);
    }
  }

  return output;
};

const buildSoqlFromStrategy = (strategy, params) => {
  const fields = [
    "AccountId", "Affiliation_Student__c", "ASURite_ID__c", "Birthdate",
    "Country_of_Citizenship__r.Name", "Country_of_Citizenship__r.ISO_Code__c", "Country_of_Citizenship__c",
    "CreatedDate", "Email", "EMPLID__c", "Ethnicity__c", "FirstName", "Gender__c", "Id",
    "HomePhone", "Language_Spoken_At_Home__c", "LastName", "Lead_Email__c", "MailingAddress",
    "Middle_Name__c", "MobilePhone", "OtherAddress", "Other_Contact_Type__c", "Parent_Email__c",
    "Phone", "Work_Phone__c", "RecordTypeId", "RecordType.Name", "Self_Reported_ASU_Student_Alum__c",
    "SSB_CRMSYSTEM_ACCT_ID__c", "SMS_Phone__c"
  ];

  const safe = (v) => v?.replace(/'/g, "\'") || "";

  const clauses = {
    asurite: `ASURite_ID__c = '${safe(params.asurite)}'`,

    firstname_email: `(
      ((FirstName = '${safe(params.firstname)}' OR 
        SF_First_Name__c = '${safe(params.firstname)}') AND (
        Email = '${safe(params.email)}') OR 
        Lead_Email__c = '${safe(params.email)}' OR
        Lead_Secondary_Email__c = '${safe(params.email)}' OR
        Personal_Email__c = '${safe(params.email)}' OR
        ASU_Email__c = '${safe(params.email)}' OR
        ASU_Gmail__c = '${safe(params.email)}' OR
        EPO_Email__c = '${safe(params.email)}'))
    )`,

    name_birthdate_postalcode: `(
      (FirstName = '${safe(params.firstname)}' OR SF_First_Name__c = '${safe(params.firstname)}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (Birthdate = '${safe(params.birthdate)}' OR SF_Birthdate__c = '${safe(params.birthdate)}') AND
      (MailingPostalCode like '${safe(params.postalcode).substring(0, 5) + '%'}' OR 
      SF_Mailing_ZIP__c like '${safe(params.postalcode).substring(0, 5) + '%'}')
    )`,

    name_phone: `(
      (FirstName = '${safe(params.firstname)}' OR SF_First_Name__c = '${safe(params.firstname)}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (Phone = '${safe(params.phone)}' OR Work_Phone__c = '${safe(params.phone)}' OR
       HomePhone = '${safe(params.phone)}' OR MobilePhone = '${safe(params.phone)}' OR
       SF_Mobile__c = '${safe(params.phone)}' OR OtherPhone = '${safe(params.phone)}')
    )`,

    name_address: `(
      (FirstName = '${safe(params.firstname)}' OR SF_First_Name__c = '${safe(params.firstname)}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (MailingPostalCode like '${safe(params.postalcode).substring(0, 5) + '%'}' OR 
      SF_Mailing_ZIP__c like '${safe(params.postalcode).substring(0, 5) + '%'}') AND
      (MailingStreet = '${safe(params.street)}' OR SF_Mailing_Street__c = '${safe(params.street)}')
    )`,

    nameshort_phone: `(
      (FirstName like '${safe(params.firstname).substring(0, 3) + '%'}' OR 
      SF_First_Name__c like '${safe(params.firstname).substring(0, 3) + '%'}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (Phone = '${safe(params.phone)}' OR Work_Phone__c = '${safe(params.phone)}' OR
       HomePhone = '${safe(params.phone)}' OR MobilePhone = '${safe(params.phone)}' OR
       SF_Mobile__c = '${safe(params.phone)}' OR OtherPhone = '${safe(params.phone)}')
    )`,

    nameshort_birthdate_postalcode: `(
      (FirstName like '${safe(params.firstname).substring(0, 3) + '%'}' OR 
      SF_First_Name__c like '${safe(params.firstname).substring(0, 3) + '%'}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (Birthdate = '${safe(params.birthdate)}' OR SF_Birthdate__c = '${safe(params.birthdate)}') AND
      (MailingPostalCode like '${safe(params.postalcode).substring(0, 5) + '%'}' OR 
      SF_Mailing_ZIP__c like '${safe(params.postalcode).substring(0, 5) + '%'}')
    )`,

    nameshort_addressshort: `(
      (FirstName like '${safe(params.firstname).substring(0, 3) + '%'}' OR 
      SF_First_Name__c like '${safe(params.firstname).substring(0, 3) + '%'}') AND
      (LastName = '${safe(params.lastname)}' OR SF_Last_Name__c = '${safe(params.lastname)}') AND
      (MailingPostalCode like '${safe(params.postalcode).substring(0, 5) + '%'}' OR 
      SF_Mailing_ZIP__c like '${safe(params.postalcode).substring(0, 5) + '%'}') AND
      (MailingStreet like '${safe(params.street).substring(0, 3) + '%'}' OR 
      SF_Mailing_Street__c like '${safe(params.street).substring(0, 3) + '%'}')
    )`
  
  };

  if (!clauses[strategy]) {
    throw new Error(`Unrecognized strategy: ${strategy}`);
  }

  return `SELECT ${fields.join(", ")} FROM Contact WHERE ${clauses[strategy]}`;
};

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const matchedPaths = strategyMatchers
    .filter(m => m.required.every(k => queryParams[k]))
    .map(m => m.id);

  if (matchedPaths.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing valid parameter combination. Refer to /contact documentation."
      })
    };
  }

  const matches = matchedPaths.map(strategy => ({
    strategy,
    soql: buildSoqlFromStrategy(strategy, queryParams)
  }));

  const input = { matches };

  try {
    const start = await stepFunctionsClient.send(
      new StartExecutionCommand({
        stateMachineArn: stepFunctionArn,
        input: JSON.stringify(input)
      })
    );

    const output = await waitForExecution(start.executionArn);

    return {
      statusCode: 200,
      body: output
    };
  } catch (err) {
    console.error("Step Function execution failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal error starting contact match" })
    };
  }
};
