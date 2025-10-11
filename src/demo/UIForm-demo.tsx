import { useState } from "react";
import { Card, Space, Typography, Divider } from 'antd';
import { UIForm } from "../components/form/UIForm";
import type { JsfObjectSchema } from "@remoteoss/json-schema-form";

const { Title, Text } = Typography;

// Schema más completo para mostrar diferentes tipos de campos
const complexSchema: JsfObjectSchema = {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "personalInfo": {
      "type": "object",
      "title": "Personal Information",
      "description": "Basic personal details",
      "x-jsf-presentation": {
        "inputType": "fieldset"
      },
      "properties": {
        "firstName": {
          "title": "First Name",
          "type": "string",
          "minLength": 2,
          "maxLength": 50,
          "x-jsf-presentation": {
            "inputType": "text"
          },
          "x-jsf-errorMessage": {
            "required": "First name is required",
            "minLength": "First name must be at least 2 characters",
            "maxLength": "First name cannot exceed 50 characters"
          }
        },
        "lastName": {
          "title": "Last Name", 
          "type": "string",
          "minLength": 2,
          "maxLength": 50,
          "x-jsf-presentation": {
            "inputType": "text"
          }
        },
        "email": {
          "title": "Email Address",
          "type": "string",
          "format": "email",
          "x-jsf-presentation": {
            "inputType": "email"
          },
          "x-jsf-errorMessage": {
            "required": "Email is required",
            "format": "Please enter a valid email address"
          }
        },
        "age": {
          "title": "Age",
          "type": "integer",
          "minimum": 18,
          "maximum": 120,
          "x-jsf-presentation": {
            "inputType": "number"
          }
        }
      },
      "required": ["firstName", "lastName", "email"]
    },
    "preferences": {
      "type": "object", 
      "title": "Preferences",
      "x-jsf-presentation": {
        "inputType": "fieldset"
      },
      "properties": {
        "country": {
          "title": "Country",
          "type": "string",
          "x-jsf-presentation": {
            "inputType": "country"
          }
        },
        "newsletter": {
          "title": "Subscribe to newsletter",
          "type": "boolean",
          "x-jsf-presentation": {
            "inputType": "checkbox"
          },
          "default": false
        },
        "contactMethod": {
          "title": "Preferred Contact Method",
          "type": "string",
          "oneOf": [
            { "const": "email", "title": "Email" },
            { "const": "phone", "title": "Phone" },
            { "const": "sms", "title": "SMS" }
          ],
          "x-jsf-presentation": {
            "inputType": "radio"
          }
        },
        "interests": {
          "title": "Interests",
          "type": "array",
          "items": {
            "anyOf": [
              { "const": "tech", "title": "Technology" },
              { "const": "sports", "title": "Sports" },
              { "const": "music", "title": "Music" },
              { "const": "travel", "title": "Travel" },
              { "const": "food", "title": "Food" }
            ]
          },
          "x-jsf-presentation": {
            "inputType": "select"
          }
        }
      }
    },
    "bio": {
      "title": "Bio",
      "description": "Tell us about yourself",
      "type": "string",
      "maxLength": 500,
      "x-jsf-presentation": {
        "inputType": "textarea"
      }
    },
    "birthDate": {
      "title": "Birth Date",
      "type": "string", 
      "format": "date",
      "x-jsf-presentation": {
        "inputType": "date"
      }
    }
  },
  "required": ["personalInfo"]
};

const initialValues = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  preferences: {
    newsletter: true,
    contactMethod: 'email'
  }
};

export default function UIFormDemo() {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

  async function handleSubmit(values: any, errors?: any) {
    console.log('Submitted values:', values);
    console.log('Errors:', errors);
    
    if (!errors || Object.keys(errors).length === 0) {
      setSubmittedData(values);
      // Simular envío async
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Form submitted successfully!');
    }
  }

  function handleChange(values: any, errors?: any) {
    setFormData(values);
    console.log('Form changed:', { values, errors });
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>JForm Demo - Complete UI Library</Title>
      <Text type="secondary">
        This demo showcases the JForm component with all field types integrated with Ant Design.
      </Text>
      
      <Divider />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Formulario principal */}
        <Card title="User Registration Form" style={{ width: '100%' }}>
          <UIForm
            schema={complexSchema}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onChange={handleChange}
            config={{
              layout: 'vertical',
              size: 'middle',
              showRequiredMark: true,
              validateTrigger: 'onChange'
            }}
          />
        </Card>

        {/* Datos en tiempo real */}
        {formData && (
          <Card title="Form Data (Live)" size="small">
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </Card>
        )}

        {/* Datos enviados */}
        {submittedData && (
          <Card title="Submitted Data" size="small" style={{ borderColor: '#52c41a' }}>
            <pre style={{ 
              background: '#f6ffed', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  );
}