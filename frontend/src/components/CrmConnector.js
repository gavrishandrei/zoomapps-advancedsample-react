import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Form, Container, Button, Dropdown, Row, Col, Accordion, DropdownButton, Toast } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function CrmConnector(props) {
    const crmItems = [
        {label: 'Hubspot', value: 'hubspot'},
        {label: 'Zoho', value: 'zoho'},
        {label: 'Pipedrive', value: 'pipedrive'},
        {label: 'SugarCRM', value: 'sugar'}
    ];

    const [selectedCrm, setSelectedCrm] = useState(crmItems[0]);

    const handleSelectCrm = (eventKey) => {
        const selectedCrmItem = crmItems.find(item => item.value === eventKey);
        setSelectedCrm(selectedCrmItem);
    };

    return (
        <div>
            <Container>
                <Row>
                    <Col>
                        <div className="m-1 crm-dropdown">
                            <Dropdown onSelect={handleSelectCrm}>
                                <Dropdown.Toggle variant="light" id="dropdown-basic">
                                CRM: {selectedCrm.label}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                {
                                    crmItems.map((item, index) => (
                                    <Dropdown.Item key={index} eventKey={item.value}>
                                        {item.label}
                                    </Dropdown.Item>
                                    ))
                                }
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </Col>
                </Row>
            </Container>
            {selectedCrm.value === 'hubspot' ? (
                <div>Hubspot</div>
            ) : (
                <div>Other</div>
            )}
        </div>
    );
    
}
export default CrmConnector;