import { useState, useMemo } from "react";
import { Card, Space, Typography, Divider } from 'antd';
import { UIForm } from "../components/form/UIForm";
import type { AsyncOptionsLoader, JsfObjectSchema } from "@remoteoss/json-schema-form";

const { Title, Text } = Typography;

// Schema más completo para mostrar diferentes tipos de campos

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
          "md": 1,
          "lg": 2
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
    "country": {
      "title": "País",
      "type": 'number',
      'x-jsf-presentation': {
        "inputType": 'select',
        "options": [
          { "label": "USA", "value": 1 },
          { "label": "Canada", "value": 2 },
          { "label": "Mexico", "value": 3 }
        ]
      },
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,
          "md": 2,
          "lg": 4
        }
      },
    },
    "state": {
      "title": "Área Geográfica",
      "type": 'number',
      'x-jsf-presentation': {
        "inputType": 'select',
        "asyncOptions": { 
          "id": 'countriesLoader',
          'dependencies': ['country']
        },
      },
      "x-jsf-layout": {
        "colSpan": {
          "sm": 1,
          "md": 2,
          "lg": 1
        }
      },
    },
    "country_search": {
      "type": 'string',
      "title": "Search country",
      'x-jsf-presentation': {
        "inputType": 'autocomplete',
        "asyncOptions": { 
          "id": 'searchCountry',
          "searchable": true
        },
      },
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
  const [responsiveData, setResponsiveData] = useState<any>(null);

  async function handleSubmit(values: any, errors?: any) {
    if (!errors || Object.keys(errors).length === 0) {
      setSubmittedData(values);
      // Simular envío async
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Form submitted successfully!');
    }
  }

  function handleResponsiveChange(values: any, errors?: any) {
    setResponsiveData(values);
    console.log('Responsive form changed:', { values, errors });
  }

  // CRITICAL: useMemo to prevent asyncLoader from being recreated on every render
  // Without this, createHeadlessForm re-runs and loses asyncOptions.loader
  const asyncLoader: Record<string, AsyncOptionsLoader> = useMemo(() => ({
    countriesLoader: async (context) => {
      const { formValues } = context
      const countryCode = formValues.country

      console.log({countryCode, formValues})
      if (!countryCode) {
        return { options: [] }
      }
      const req = await fetch('https://fakeapi.net/users')
      const res = await req.json()

      console.log(res)
      return {options: res.data.map((d: any) => ({label: d.username, value: d.id}) )}
    },
    searchCountry: async (context) => {
      const { formValues, search } = context

      console.log({search, formValues})

      const req = await fetch(`https://fakeapi.net/users`)
      const res = await req.json()

      console.log(res)
      return {options: res.data.map((d: any) => ({label: d.username, value: d.id?.toString()}) )}
    }
  }), []); // Empty deps = created once, never changes

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Demo</Title>
      <Divider />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Responsive ColSpan Demo */}
        <Card title="Responsive ColSpan" style={{ width: '100%' }}>
          
          <UIForm
            schema={responsiveColSpanSchema}
            initialValues={{}}
            onSubmit={handleSubmit}
            onChange={handleResponsiveChange}
            asyncLoaders={asyncLoader}
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