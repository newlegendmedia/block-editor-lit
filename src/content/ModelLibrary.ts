import { ModelDefinition, AtomType } from '../types/ModelDefinition';

export class ModelLibrary {
    private models: Map<string, ModelDefinition>;
  
    constructor() {
      this.models = new Map();
      this.initializeModels();
    }
  
    private initializeModels() {
      this.models.set('person', {
        key: 'person',
        label: 'Person',
        type: 'model',
        properties: [
          {
            type: 'model',
            key: 'name',
            label: 'Full Name',
            properties: [
              { type: 'element', key: 'firstName', label: 'First Name', atom: AtomType.Text },
              { type: 'element', key: 'lastName', label: 'Last Name', atom: AtomType.Text }
            ]
          },
          {
            type: 'model',
            key: 'contactInfo',
            label: 'Contact Information',
            properties: [
              { 
                type: 'element', 
                key: 'email', 
                label: 'Email Address', 
                atom: AtomType.Text,
              },
              { 
                type: 'element', 
                key: 'phone', 
                label: 'Phone Number', 
                atom: AtomType.Text,
              }
            ]
          },
          {
            type: 'element',
            key: 'maritalStatus',
            label: 'Marital Status',
            atom: AtomType.Text, // Simplified from Enum for now
          },
          {
            type: 'list',
            key: 'emergencyContacts',
            label: 'Emergency Contacts',
            items: {
              type: 'model',
              key: 'emergencyContact', // Add this key
              properties: [
                { type: 'element', key: 'name', label: 'Name', atom: AtomType.Text },
                { type: 'element', key: 'phone', label: 'Phone', atom: AtomType.Text }
              ]
            }
          }
        ]
      });
  
      // You can add more models here as needed
    }
  
    getModel(key: string): ModelDefinition | undefined {
      return this.models.get(key);
    }
  }