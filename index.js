const AWS = require('aws-sdk');

AWS.config.update({
    region: 'ap-southeast-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamoTable = 'products';

// exports.handler = async (event) => {
//     try{
//         const data = JSON.parse(event.body);
//         const result = updateProduct(data);
//         return result;
//     }catch(e){
//         return responses(400, {message: String(e)});
//     }
// };

const responses = (statusCode, body) => {
    return {
        statusCode,
        body: JSON.stringify(body)
    }
}

const scanDynamoRecords = async(scanParams, itemArray) => {
  try {
    const dynamoData = await dynamoDB.scan(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch(error) {
    return responses(400, error)
  }
}

const getProducts = async() => {
    try{
        const params = {
            TableName: dynamoTable
        }
        let body = {
            message: 'List of product',
        }
        const allProduct = await scanDynamoRecords(params, []);
        console.log(allProduct)
        if(allProduct){
            body.products = allProduct;
        }else{
            body.products = 'No product exist';
        }
        return responses(200, body);
    }catch(e){
        return responses(400, String(e));
    }
}

const addProduct = async(req) => {
    try{
        const params = {
            TableName: dynamoTable,
            Item: req
        };
        await dynamoDB.put(params).promise();
        const body = {
            message: 'Success',
            data: req,
        }
        return responses(200, body);
    }catch(e){
        return responses(400, String(e));
    }
}

const updateProduct = async(data) => {
    try{
        let newValue = {};
        let syntaxArr = [];
        for(let x in data){
            if(x !== 'id'){
                newValue[`:${x}`] = data[x];
                syntaxArr.push(`${x} = :${x}`)
            }
        }
        const syntax = syntaxArr.join(', ')
        const params = {
            TableName: dynamoTable,
            Key: {
                id: data.id
            },
            UpdateExpression: `set ${syntax}`,
            ExpressionAttributeValues: newValue,
            ReturnValues: 'UPDATED_NEW'
        }
        const result = await dynamoDB.update(params).promise();
        return responses(200, {message: "SUCCESS", result});
    }catch(e){
        return responses(400, {message: String(e)});
    }
}

const deleteProduct = async(id) => {
    try{
        const params = {
            TableName: dynamoTable,
            Key: {
                id
            },
            ReturnValues: 'ALL_OLD'
        }
        const data = await dynamoDB.delete(params).promise();
        return responses(200, {message: "SUCCESS", data});
    }catch(e){
        return responses(400, {message: String(e)});
    }
}
