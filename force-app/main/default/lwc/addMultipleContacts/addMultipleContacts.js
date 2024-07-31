import { LightningElement, wire, track,api } from 'lwc';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import GENDER_INDENTITY_FIELD from '@salesforce/schema/Contact.GenderIdentity';
import CONTACT_OBJ from '@salesforce/schema/Contact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {closeActionScreenEvent} from 'lightning/actions'
import saveMultipleContacts from '@salesforce/apex/addMultipleContactsController.saveMultipleContacts';

export default class AddMultipleContacts extends LightningElement {
  @api recordId;

  @track contacts = [];
  isLoading = false;

  @wire(getObjectInfo, { objectApiName: CONTACT_OBJ })
  contactObjectInfo;

  @wire(getPicklistValues, { recordTypeId: '$contactObjectInfo.data.defaultRecordTypeId', fieldApiName: GENDER_INDENTITY_FIELD })
  genderPicklistValues;

  get getGenderPicklistvalues() {
    return this.genderPicklistValues?.data?.values;
  }

  connectedCallback() {
    this.addNewClickHandler();
  }

  addNewClickHandler(e) {
    this.contacts.push({
      tempId: Date.now()
    })
  }

  deleteClickHandler(e) {
    if (this.contacts.length == 1) {
      this.ShowToast('You cannot delete last contact.')
      return;
    }
    let tempId = e.target?.dataset.tempId;
    this.contacts = this.contacts.filter(a => a.tempId != tempId);
  }

  // handler for value changed in input fields 
  elementChangeHandler(e) {
    let contactRow = this.contacts.find(a => a.tempId == e.target.dataset.tempId);
    if (contactRow) {
      contactRow[e.target.name] = e.target?.value;
    }
  }

  async submitClickHandler(e) {
    const allvalid = this.checkControlsValidity();
    if (allvalid) {
      this.isLoading = true;
      this.contacts.forEach(a=>a.ContactId=this.recordId);
  let response = await saveMultipleContacts({contacts:this.contacts});
  if(response.isSuccess){
    this.ShowToast('Contacts Saved Successfully','success','success');
    this.dispatchEvent(new closeActionScreenEvent());

  }else{
    this.ShowToast('something went wrong while saving Contacts -'+response.message);
  }
  this.isLoading=false;
    }
    else {
      this.ShowToast('Please correct below errors to proceed further.')
    }
  }

  checkControlsValidity() {
    let isValid = true,
      controls = this.template.querySelectorAll('lightning-input,lightning-combobox');

    controls.forEach(field => {
      if (!field.checkValidity()) {
        field.reportValidity();
        isValid = false;
      }
    });
    return isValid;
  }


  ShowToast(message, title = 'Error', variant = 'error') {
    const event = new ShowToastEvent({
      title,
      message, variant
    });
    this.dispatchEvent(event);
  }
}
