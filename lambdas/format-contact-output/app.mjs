export const handler = async (event) => {
    const formatContact = (record) => {
      const address = record.MailingAddress?.country ? record.MailingAddress : record.OtherAddress;

      return {
        accountid: record.AccountId,
        asurite: record.ASURite_ID__c,
        birthdate: record.Birthdate || null,
        email: record.Email,
        emplid: record.EMPLID__c,
        firstname: record.FirstName,
        gender: record.Gender__c,
        id: record.Id,
        lastname: record.LastName,
        middlename: record.Middle_Name__c,
        phone: record.Phone || record.Work_Phone__c || record.HomePhone,
        mobilePhone: record.MobilePhone,
        city: address?.city,
        country: address?.country,
        countrycode: address?.countryCode,
        createddate: record.CreatedDate,
        street: address?.street,
        postalcode: address?.postalCode,
        recordtypeid: record.RecordTypeId,
        recordtypename: record.RecordType?.Name,
        state: address?.state,
        statecode: address?.stateCode
      };
    };

    const formatted = event.matches?.flatMap(match =>
      match.results.map(r => ({
        confidence: match.confidence,
        source: match.source,
        contact: formatContact(r)
      }))
    ) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ matches: formatted })
    };
  };
