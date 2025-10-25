import { useState } from "react";
import { Card, Space, Typography, Divider } from 'antd';
import { UIForm } from "../components/form/UIForm";
import type { JsfObjectSchema } from "@remoteoss/json-schema-form";

const { Title, Text } = Typography;

// Schema más completo para mostrar diferentes tipos de campos


const initialValues = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe'
  },
  preferences: {
    newsletter: true,
    contactMethod: 'email'
  },
  registrationDate: '2025-10-22'
};

// Schema con colSpan responsivo
const responsiveColSpanSchema: JsfObjectSchema = {
  "type": "object",
  "title": "Responsive ColSpan Demo",
  "x-jsf-layout": {
    "type": "columns",
    "columns": 4,
    "gap": "16px",
    "responsive": {
      "sm": 1,  // 1 columna en móvil
      "md": 2,  // 2 columnas en tablet  
      "lg": 4   // 4 columnas en desktop
    }
  },
  "properties": {
    "title": {
      "title": "Profile Title",
      "type": "string",
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,
          "md": 2,
          "lg": 4 
        }
      },
      "x-jsf-presentation": {
        "inputType": "text"
      }
    },
    "firstName": {
      "title": "First Name",
      "type": "string",
      "x-jsf-presentation": {
        "inputType": "text"
      },
      "x-jsf-errorMessage": {
        "required": "Campo requerido",
      },
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,
          "md": 2,
          "lg": 2 
        }
      }
    },
    "lastName": {
      "title": "Last Name",
      "type": "string",
      "x-jsf-presentation": {
        "inputType": "text"
      }
    },
    "email": {
      "title": "Email",
      "type": "string",
      "format": "email",
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,  // 1 columna en móvil
          "md": 2,  // 2 columnas en tablet
          "lg": 2   // 2 columnas en desktop
        }
      },
      "x-jsf-presentation": {
        "inputType": "email"
      }
    },
    "phone": {
      "title": "Phone",
      "type": "string",
      "x-jsf-presentation": {
        "inputType": "text"
      }
    },
    "birthDate": {
      "title": "Birth Date",
      "type": "string",
      "format": "DD/MM/YYYY",
      "x-jsf-presentation": {
        "inputType": "date",
      }
    },
    "description": {
      "title": "Description",
      "type": "string",
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,  // 1 columna en móvil
          "md": 2,  // 2 columnas en tablet  
          "lg": 3   // 3 columnas en desktop
        }
      },
      "x-jsf-presentation": {
        "inputType": "textarea"
      }
    },
    "status": {
      "title": "Status",
      "type": "string",
      "oneOf": [
        { "const": "active", "title": "Active" },
        { "const": "inactive", "title": "Inactive" }
      ],
      "x-jsf-presentation": {
        "inputType": "radio"
      }
    }
  },
  "required": ["firstName", "lastName", "email"]
};


export default function UIFormDemo() {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [responsiveData, setResponsiveData] = useState<any>(null);

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

  function handleLayoutChange(values: any, errors?: any) {
    setLayoutData(values);
    console.log('Layout form changed:', { values, errors });
  }

  function handleResponsiveChange(values: any, errors?: any) {
    setResponsiveData(values);
    console.log('Responsive form changed:', { values, errors });
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>UIForm Demo - Complete UI Library</Title>
      <Text type="secondary">
        This demo showcases the UIForm component with all field types and responsive layouts integrated with Ant Design.
      </Text>
      
      <Divider />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Responsive ColSpan Demo */}
        <Card title="🆕 Responsive ColSpan Demo" style={{ width: '100%' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            This form demonstrates responsive <strong>colSpan</strong> - fields change their column span based on screen size:
            <br />
            • <strong>Title</strong>: Spans full width on all devices (1/2/4 columns)
            • <strong>Email</strong>: 1 col on mobile, 2 cols on tablet/desktop
            • <strong>Description</strong>: 1 col on mobile, 2 on tablet, 3 on desktop
            • <strong>Other fields</strong>: Adapt automatically
          </Text>
          <UIForm
            schema={responsiveColSpanSchema}
            initialValues={{}}
            onSubmit={handleSubmit}
            onChange={handleResponsiveChange}
            config={{
              layout: 'vertical',
              size: 'middle',
              showRequiredMark: true,
              validateTrigger: 'onChange'
            }}
          />
        </Card>



        {/* Datos del responsive demo */}
        {responsiveData && (
          <Card title="🆕 Responsive ColSpan Data (Live)" size="small">
            <pre style={{ 
              background: '#f6ffed', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(responsiveData, null, 2)}
            </pre>
          </Card>
        )}

        {/* Datos del layout demo */}
        {layoutData && (
          <Card title="Basic Layout Data (Live)" size="small">
            <pre style={{ 
              background: '#e6f7ff', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(layoutData, null, 2)}
            </pre>
          </Card>
        )}

        {/* Datos en tiempo real */}
        {formData && (
          <Card title="Registration Form Data (Live)" size="small">
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