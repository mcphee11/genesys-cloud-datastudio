// Google DataStudio connector example to Genesys Cloud API.
//
// created with help of https://github.com/googledatastudio/community-connectors/tree/master/JSON-connect


//Global Vars
var CLIENT_ID = '';
var CLIENT_SECRET = '';
var DOMAIN = '';

/**
 * Throws and logs script exceptions.
 *
 * @param {String} message The exception message
 */
function sendUserError(message) {
  var cc = DataStudioApp.createCommunityConnector();
  cc.newUserError()
    .setText(message)
    .throwException();
}

/**
 * function  `getAuthType()`
 *
 * @returns {Object} `AuthType` used by the connector.
 */
function getAuthType() {
  return {type: 'NONE'};
}

/**
 * function  `isAdminUser()`
 *
 * @returns {Boolean} Currently just returns false. Should return true if the current authenticated user at the time
 *                    of function execution is an admin user of the connector.
 */
function isAdminUser() {
  return false;
}

/**
 * Returns the user configurable options for the connector.
 *
 * Required function for Community Connector.
 *
 * @param   {Object} request  Config request parameters.
 * @returns {Object}          Connector configuration to be displayed to the user.
 */
function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();

  var option1 = config
    .newOptionBuilder()
    .setLabel('Text')
    .setValue('text');

  var option2 = config
    .newOptionBuilder()
    .setLabel('Inline')
    .setValue('inline');
  
  var au = config
    .newOptionBuilder()
    .setLabel('mypurecloud.com.au')
    .setValue('mypurecloud.com.au');
  
   var com = config
    .newOptionBuilder()
    .setLabel('mypurecloud.com')
    .setValue('mypurecloud.com');
  
   var jp = config
    .newOptionBuilder()
    .setLabel('mypurecloud.jp')
    .setValue('mypurecloud.jp');
  
   var de = config
    .newOptionBuilder()
    .setLabel('mypurecloud.de')
    .setValue('mypurecloud.de');
  
   var ie = config
    .newOptionBuilder()
    .setLabel('mypurecloud.ie')
    .setValue('mypurecloud.ie');
  
   var GET = config
    .newOptionBuilder()
    .setLabel('GET')
    .setValue('GET');
  
   var POST = config
    .newOptionBuilder()
    .setLabel('POST')
    .setValue('POST');

  config
    .newInfo()
    .setId('instructions')
    .setText('Fill out Genesys Cloud API details');
  
  config
    .newTextInput()
    .setId('clientid')
    .setName('Enter clientID of "client_credentials')
    .setHelpText('e.g. found in Genesys Cloud ORG')
    .setPlaceholder('');
  
  config
    .newTextInput()
    .setId('secret')
    .setName('Enter secret of "client_credentials')
    .setHelpText('e.g. found in Genesys Cloud ORG')
    .setPlaceholder('');

  config
    .newTextInput()
    .setId('url')
    .setName('Enter the URL of a JSON data source')
    .setHelpText('e.g. /api/v2/users')
    .setPlaceholder('/api/v2/users');
  
  config
    .newSelectSingle()
    .setId('domain') 
    .setName('Domain')
    .setHelpText('Set the ORG location')
    .addOption(au)
    .addOption(com)
    .addOption(jp)
    .addOption(de)
    .addOption(ie);
  
  config
    .newSelectSingle()
    .setId('method') 
    .setName('Request Method')
    .setHelpText('Method of request')
    .addOption(GET)
    .addOption(POST);
  
  config
    .newTextArea()
    .setId('body')
    .setName('Enter the body of the POST method')
    .setHelpText('e.g. {data: "value"}')
    .setPlaceholder('');

  config
    .newSelectSingle()
    .setId('nestedData')
    .setName('Nested data')
    .setHelpText('How to import nested data, as text or inline.')
    .setAllowOverride(true)
    .addOption(option1)
    .addOption(option2);

  config.setDateRangeRequired(false);

  return config.build();
}

/**
 * Gets UrlFetch response and parses JSON
 *
 * @param   {string} url  The URL to get the data from
 * @returns {Object}      The response object
 */
function fetchJSON(url, method, body) {
  try {
    var service = getService();
    console.log('method: ' + method + ' token: '+service.getAccessToken());
    if(method == 'GET'){
    var response = UrlFetchApp.fetch(url, { method : 'get',
                                           contentType : 'application/json; charset=UTF-8',
                                           headers: { Authorization: 'Bearer ' + service.getAccessToken() }
                                           //payload : JSON.stringify(data)
                                          });
    }
    if(method == 'POST'){
    var response = UrlFetchApp.fetch(url, { method : 'post',
                                           contentType : 'application/json; charset=UTF-8',
                                           headers: { Authorization: 'Bearer ' + service.getAccessToken() },
                                           payload : body
                                          });
    }
  } catch (e) {
    sendUserError('"' + url + '" returned an error:' + e);
  }

  try {
    var content = JSON.parse(response);
  } catch (e) {
    sendUserError('Invalid JSON format. ' + e);
  }

  return content;
}

/**
 * Fetches data. Either by calling getCachedData or fetchJSON, depending on the cache configuration parameter.
 *
 * @param   {String}  url   The URL to get the data from
 * @param   {Boolean} cache Parameter to determine whether the request should be cached
 * @returns {Object}        The response object
 */
function fetchData(url, method, body) {
  if (!url || !url.match(/^https?:\/\/.+$/g)) {
    sendUserError('"' + url + '" is not a valid url.');
  }
  var content = fetchJSON(url, method, body);
  if (!content) sendUserError('"' + url + '" returned no content.');
  return content;
}

/**
 * Matches the field value to a semantic
 *
 * @param   {Mixed}   value   The field value
 * @param   {Object}  types   The list of types
 * @return  {string}          The semantic type
 */
function getSemanticType(value, types) {
  if (!isNaN(parseFloat(value)) && isFinite(value)) {
    return types.NUMBER;
  } else if (value === true || value === false) {
    return types.BOOLEAN;
  } else if (typeof value != 'object' && value != null) {
    if (
      value.match(
        new RegExp(
          /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        )
      )
    ) {
      return types.URL;
    } else if (!isNaN(Date.parse(value))) {
      return types.YEAR_MONTH_DAY_HOUR;
    }
  }
  return types.TEXT;
}

/**
 *  Creates the fields
 *
 * @param   {Object}  fields  The list of fields
 * @param   {Object}  types   The list of types
 * @param   {String}  key     The key value of the current element
 * @param   {Mixed}   value   The value of the current element
 */
function createField(fields, types, key, value) {
  var semanticType = getSemanticType(value, types);
  var field =
    semanticType == types.NUMBER ? fields.newMetric() : fields.newDimension();

  field.setType(semanticType);
  field.setId(key.replace(/\s/g, '_').toLowerCase());
  field.setName(key);
}

/**
 * Handles keys for recursive fields
 *
 * @param   {String}  currentKey  The key value of the current element
 * @param   {Mixed}   key         The key value of the parent element
 * @returns {String}  if true
 */
function getElementKey(key, currentKey) {
  if (currentKey == '' || currentKey == null) {
    return;
  }
  if (key != null) {
    return key + '.' + currentKey.replace('.', '_');
  }
  return currentKey.replace('.', '_');
}

/**
 * Extracts the objects recursive fields and adds it to fields
 *
 * @param   {Object}  fields  The list of fields
 * @param   {Object}  types   The list of types
 * @param   {String}  key     The key value of the current element
 * @param   {Mixed}   value   The value of the current element
 * @param   {boolean} isInline if true
 */
function createFields(fields, types, key, value, isInline) {
  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    Object.keys(value).forEach(function(currentKey) {
      var elementKey = getElementKey(key, currentKey);

      if (isInline && value[currentKey] != null) {
        createFields(fields, types, elementKey, value[currentKey], isInline);
      } else {
        createField(fields, types, currentKey, value);
      }
    });
  } else if (key !== null) {
    createField(fields, types, key, value);
  }
}

/**
 * Parses first line of content to determine the data schema
 *
 * @param   {Object}  request getSchema/getData request parameter.
 * @param   {Object}  content The content object
 * @return  {Object}           An object with the connector configuration
 */
function getFields(request, content) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;
  var isInline = request.configParams.nestedData === 'inline';

  if (!Array.isArray(content)) content = [content];

  if (typeof content[0] !== 'object' || content[0] === null) {
    sendUserError('Invalid JSON format');
  }
  try {
    createFields(fields, types, null, content[0], isInline);
  } catch (e) {
    sendUserError('Unable to identify the data format of one of your fields.');
  }
  return fields;
}

/**
 * Returns the schema for the given request.
 *
 * @param   {Object} request Schema request parameters.
 * @returns {Object} Schema for the given request.
 */
function getSchema(request) {
  CLIENT_ID = request.configParams.clientid;
  CLIENT_SECRET = request.configParams.secret;
  DOMAIN = request.configParams.domain;
  Logger.log('getSchema: ' + 'https://api.' + request.configParams.domain + request.configParams.url + ' method: '+ request.configParams.method + ' body: '+ request.configParams.body);
  var content = fetchData('https://api.' + request.configParams.domain + request.configParams.url, request.configParams.method, request.configParams.body);
  var fields = getFields(request, content).build();
  return {schema: fields};
}

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 * Thanks to jhildenbiddle https://stackoverflow.com/users/4903063/jhildenbiddle
 * https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 *
 * @param            Objects to merge
 * @returns {object} New object with merged key/values
 */
function mergeDeep() {
  var objects = Array.prototype.slice.call(arguments);

  return objects.reduce(function(prev, obj) {
    Object.keys(obj).forEach(function(key) {
      var pVal = prev[key];
      var oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat.apply(pVal, toConsumableArray(oVal));
      } else if (pVal === Object(pVal) && oVal === Object(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    return prev;
  }, {});
}

/**
 *  Converts date strings to YYYYMMDDHH:mm:ss
 *
 * @param   {String} val  Date string
 * @returns {String}      Converted date string
 */
function convertDate(val) {
  var date = new Date(val);
  return (
    date.getUTCFullYear() +
    ('0' + (date.getUTCMonth() + 1)).slice(-2) +
    ('0' + date.getUTCDate()).slice(-2) +
    ('0' + date.getUTCHours()).slice(-2)
  );
}

/**
 * Validates the row values. Only numbers, boolean, date and strings are allowed
 *
 * @param   {Field} field The field declaration
 * @param   {Mixed} val   The value to validate
 * @returns {Mixed}       Either a string or number
 */
function validateValue(field, val) {
  if (field.getType() == 'YEAR_MONTH_DAY_HOUR') {
    val = convertDate(val);
  }

  switch (typeof val) {
    case 'string':
    case 'number':
    case 'boolean':
      return val;
    case 'object':
      return JSON.stringify(val);
  }
  return '';
}

/**
 * Returns the (nested) values for requested columns
 *
 * @param   {Object} valuePaths       Field name. If nested; field name and parent field name
 * @param   {Object} row              Current content row
 * @returns {Mixed}                   The field values for the columns
 */
function getColumnValue(valuePaths, row) {
  for (var index in valuePaths) {
    var currentPath = valuePaths[index];

    if (row[currentPath] === null) {
      return '';
    }

    if (row[currentPath] !== undefined) {
      row = row[currentPath];
      continue;
    }
    var keys = Object.keys(row);

    for (var index_keys in keys) {
      var key = keys[index_keys].replace(/\s/g, '_').toLowerCase();
      if (key == currentPath) {
        row = row[keys[index_keys]];
        break;
      }
    }
  }
  return row;
}

/**
 * Returns an object containing only the requested columns
 *
 * @param   {Object} content          The content object
 * @param   {Object} requestedFields  Fields requested in the getData request.
 * @returns {Object}                  An object only containing the requested columns.
 */
function getColumns(content, requestedFields) {
  if (!Array.isArray(content)) content = [content];

  return content.map(function(row) {
    var rowValues = [];

    requestedFields.asArray().forEach(function(field) {
      var valuePaths = field.getId().split('.');
      var fieldValue = row === null ? '' : getColumnValue(valuePaths, row);

      rowValues.push(validateValue(field, fieldValue));
    });
    return {values: rowValues};
  });
}

/**
 * Returns the tabular data for the given request.
 *
 * @param   {Object} request  Data request parameters.
 * @returns {Object}          Contains the schema and data for the given request.
 */
function getData(request) {
  console.log('https://api.' + request.configParams.domain + request.configParams.url);
  CLIENT_ID = request.configParams.clientid;
  CLIENT_SECRET = request.configParams.secret;
  DOMAIN = request.configParams.domain;
  var content = fetchJSON('https://api.' + request.configParams.domain + request.configParams.url, request.configParams.method, request.configParams.body);
  var fields = getFields(request, content);
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = fields.forIds(requestedFieldIds);

  return {
    schema: requestedFields.build(),
    rows: getColumns(content, requestedFields)
  };
}

//------------------------------- oAuth external -----------------------------------------------

//Redirect url needs to be saved in PureCloud

/**
* Reset the authorization state, so that it can be re-tested.
*/
function reset() {
  getService().reset();
}

/**
* Configures the service.
*/
function getService() {
  Logger.log('OAuth2 Domain: '+DOMAIN);
  return OAuth2.createService('GenesysCloud')
  // Set the endpoint URLs.
  .setTokenUrl('https://login.' + DOMAIN + '/oauth/token')
  
  // Sets the custom grant type to use.
  .setGrantType('client_credentials')
  
  // Sets the required Authorization header.
  .setTokenHeaders({
    Authorization: 'Basic ' +
    Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET)
  })
  
  // Set the property store where authorized tokens should be persisted.
  .setPropertyStore(PropertiesService.getUserProperties());
}