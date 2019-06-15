import {Injectable} from '@angular/core';

@Injectable()
export class DataPathUtils {

  constructor() {
  }

  public extractDataFromResponse(data, dataPath, attr = null) {
    if (!data || !dataPath) {
      if (attr) {
        return data[attr];
      }
      return data;
    }

	
    let extractedData = data;
    const digProps = dataPath.split('.');

    for (let prop of digProps) {
      if (typeof extractedData[prop] !== 'undefined') {
        extractedData = extractedData[prop];
      } else {
        return null;
      }
    }

    if (extractedData != null && attr) {
		if(attr=='url'){
			if(extractedData['url']){
				return extractedData['url'];
			}else if(extractedData['urlPath']){
				return extractedData['urlPath'];
			}else if(extractedData['urlPattern']){
				return extractedData['urlPattern'];
			}else if(extractedData['urlPathPattern']){
				return extractedData['urlPathPattern'];
			}
		}
      return extractedData[attr];
    }
    return extractedData;
  }

  public getFieldValueInPath(field, dataPath, data) {
    if (!dataPath) {
		if(data != null)
			return data[field];
		else 
			return null;
    }

    const dataObj = this.extractDataFromResponse(data, dataPath);
    return dataObj && dataObj[field] ? dataObj[field] : null;
  }

  public extractModelFromFields(fields) {
    let dataModel = {};

    if (!fields || !fields.length) {
      return dataModel;
    }

    for (let field of fields) {
		var ignoreFields = ['urlPattern', 'url', 'delayType','delay','fault','headers'];
	 
	  if(!field.hasOwnProperty('name') || !field.name || field.name=="undefined"){
		  continue;
	  }
	  
	  if(ignoreFields.indexOf(field.name)>-1){
		  if(field.dataPath.indexOf('transformerParameters') === -1){
			continue;
		  }		
	  }
	  
      if (!field.hasOwnProperty('dataPath') || !field.dataPath) {
        dataModel[field.name] = field.value;
        continue;
      }

      const dataPathProps = field.dataPath.split('.');
      dataModel = this.buildJsonRecursively(dataModel, dataPathProps, field);
    }
	
	dataModel['persistent']=true;
	
	
	let urlPattern =fields.find( field => field.name === 'urlPattern' );
	let url =fields.find(field => field.name === 'url' );
	url.name = urlPattern.value; 
	url.dataPath ='request';
	const dataPathProps = url.dataPath.split('.');
	dataModel = this.buildJsonRecursively(dataModel, dataPathProps, url);
	
	let delayType =fields.find( field => field.name === 'delayType' );
	let delay =fields.find(field => field.name === 'delay' );	
	if(delayType.value && delayType.value !='NONE' && delay.value && !isNaN(delay.value)){
		delay.name = delayType.value;
		delay.dataPath ='response';
		delay.value = "" +delay.value;
		const dataPathProps = delay.dataPath.split('.');
		dataModel = this.buildJsonRecursively(dataModel, dataPathProps, delay);
	}
	
	let fault =fields.find(field => field.name === 'fault' );	
	if(fault.value && fault.value !='NONE'){
		fault.dataPath ='response';		
		const dataPathProps = fault.dataPath.split('.');
		dataModel = this.buildJsonRecursively(dataModel, dataPathProps, fault);
	}
	
	//set response header
	let responseHeaders =fields.find(field => field.name === 'headers'&& field.dataPath==='response' );	
	if(responseHeaders){		
		responseHeaders.value = JSON.parse(JSON.stringify(responseHeaders.value));			
		const dataPathProps = 'response'.split('.');
		dataModel = this.buildJsonRecursively(dataModel, dataPathProps, responseHeaders);
	}
	
	//set query parameter
	let queryParameters =fields.find(field => field.name === 'queryParameters'&& field.dataPath==='request' );	
	if(queryParameters){		
		queryParameters.value = JSON.parse(JSON.stringify(queryParameters.value));			
		const dataPathProps = 'request'.split('.');
		dataModel = this.buildJsonRecursively(dataModel, dataPathProps, queryParameters);
	}

    return dataModel;
  }

  public buildJsonRecursively(currentObj, propertiesArr, field) {
    if (!propertiesArr || !propertiesArr.length) {
      if(field.name==='headers' || field.name==='queryParameters' || field.name==='transformers' || field.name==='transformerParameters'  || field.name==='bodyPatterns' ){
			if(field.value){				
				try{
					currentObj[field.name] = JSON.parse(field.value);
				}catch(err){
					currentObj[field.name] = field.value;
				}
			}else{
				return currentObj;
			}
			
		}else{
			currentObj[field.name] = field.value;
		}
      return currentObj;
    }

    const prop = propertiesArr[0];
    if (!currentObj.hasOwnProperty(prop) || typeof currentObj[prop] !== 'object') {
      currentObj[prop] = {};
    }

    this.buildJsonRecursively(currentObj[prop], propertiesArr.slice(1, propertiesArr.length), field);

    return currentObj;
  }

}
