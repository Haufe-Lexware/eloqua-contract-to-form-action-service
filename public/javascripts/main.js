var contactFields='';
var dataMapping='';
var contactPicklist='';
var instanceId='';

// Fills the table with Contact Info when mapping is done
function updateFieldTable(){
	var tempTable='';
	tempTable+="<table id='fieldTable'>";
    tempTable+="<tr><th>Form Field</th><th>Contact Field</th><th></th></tr>";
	$.each( dataMapping.elements, function( index, el ) {
		tempTable+="<tr>";
		tempTable+="<td id='" + el.id + "'>" + el.name + "</td>";
		tempTable+="<td id='element_"+el.id+"'>"+getPicklistHtml(/*'sel_' + */el.id,el.name,contactFields)+"</td>";
        tempTable+="<td><input id='static_element_"+el.id+"' style='opacity:0;' type='text' onChange='textChange(this.id,this.value)'/></td>";
        
		tempTable+="</tr>";
	});
	tempTable+="</table>";
	$('#formDetailsDiv').html(tempTable);
}

// Called when the user chooses to press the button save in the Eloqua configure view
function saveMapping(instanceId){
    var url = "/ssmpsrvc/configureurl/update?instanceId="+instanceId;
	$.ajax({
		type: "POST",
		url: url,
		contentType: "application/json",
		data: JSON.stringify(dataMapping),
		success: function(data){$('#textUpdate').text('The form was sent to the server successfully');},
        error: function(xhr, status, error){
        },
		dataType: "json"
	});
}

function setDataMapping(data){
	var tempMapping=dataMapping;
	$.each( JSON.parse(data), function( index, el ) {
		tempMapping.elements.push({id: el.id, name: el.name, mapping: '', stringValue:''});
	});

	dataMapping=tempMapping;
	updateFieldTable();
    
    check_submit(false);
}

function getFormFields(formId){  
	instanceId=$( "#configInstanceId" ).val();
	dataMapping={'instanceId':instanceId, 'formId':formId, 'elements':[]};
	$.get( '/ssmpsrvc/configureurl/formsdetails/'+formId + '?instanceId='+instanceId, setDataMapping);
}

function setVisibibilityToStaticElement(element, value)
{
    if(element!=null)
    {        
        if(value.indexOf("Static")>0)
        {        
            $(element).css("opacity","100");
            
        }
        else
        {
            $(element).css("opacity","0");
        }
    }
}

//Generate the HTML for every Contact Info of the selected form
function getPicklistHtml(sel_id,fieldName,data){
	var tempHtml='';
	tempHtml+="<select id='" + sel_id + "' onchange='picklistHandler(this.id,JSON.stringify(this.options[this.selectedIndex].value));'>";
	tempHtml+="<option selected disabled>None</option>";
    tempHtml+="<option id='Static'>Static...</option>";
	$.each(data.elements, function( index, el ) {
		if (fieldName == el.name){
			tempHtml+= "<option selected='true' value='" + el.internalName + "'>" + el.name + "</option>";
			picklistHandler(sel_id, el.internalName);
		} else{
			tempHtml+= "<option value='" + el.internalName + "'>" + el.name + "</option>";
		}
	});
	tempHtml+="</select>";

	return(tempHtml);
}

function textChange(sel_id, value){
    var rest = sel_id.substring(0, sel_id.lastIndexOf("_") + 1);
    var selected_id = sel_id.substring(sel_id.lastIndexOf("_") + 1, sel_id.length);

    $(dataMapping.elements).each( function() {
		if (this.id == selected_id){
            console.log("id:"+this.id);
			this.mapping = value;
            this.status = 'static';
		}
	});
}

function picklistHandler(sel_id, picklistValue){
    var selected_static = document.getElementById("static_element_"+sel_id);
    var static_th = document.getElementById("static_th");
    setVisibibilityToStaticElement(selected_static, picklistValue);
    setVisibibilityToStaticElement(static_th, picklistValue);
  
	$(dataMapping.elements).each( function() {
		if (this.id == sel_id){
			// this.mapping = picklistValue;
			this.mapping = "{{Contact.Field(" + picklistValue + ")}}";
		}
	});    
}

// Fill the selected form's display data with Contact info
function setContactPicklist(data){
	var tempContactFields={'elements':[]};;
	$.each(data, function( index, el ) {
		tempContactFields.elements.push({id: el.id, name: el.name, internalName: el.internalName});
	});
    
	contactFields=tempContactFields;
}

function check_submit(val) {  
  if (val) {
    $('#saveMappingButton').attr("disabled", true);
  } else {
    $('#saveMappingButton').removeAttr("disabled");
  }
}

// Fill the Forms dropdown with data
function updateFormSelect(data){
	var  options='';
	$.each( data, function( index, el ) {
		options+= "<option value='" + el.id + "'>" + el.name + "</option>";
	});
	$('#configurationSelect').append(options);
}

//startup
$(function() {
	// Handler for .ready() called.
    check_submit(true);
    
    instanceId=$( "#configInstanceId" ).val();
    
	$( "#configurationSelect" ).change(function() {
		var theFormId=$( "#configurationSelect" ).val();
		getFormFields(theFormId);
        
	});

	$( "#saveMappingButton" ).click(function() {
		saveMapping(instanceId);
        $('#textUpdate').text('The form was sent to the server');
	});

	$.getJSON( '/ssmpsrvc/configureurl/getcontactfields?instanceId='+instanceId, setContactPicklist);
	$.getJSON( '/ssmpsrvc/configureurl/forms?instanceId='+instanceId, updateFormSelect);
});
