/**
 * AirTable Submission API Proxy
 *
 * This is a serverless function / backend endpoint that securely submits
 * form data to AirTable without exposing API keys to the frontend.
 *
 * Deploy this on: Vercel, Netlify Functions, AWS Lambda, or your Node.js server
 */

// For serverless deployment (Vercel/Netlify):
// module.exports = async (req, res) => {

// For Express.js server:
// app.post('/api/submit-form', async (req, res) => {

async function submitToAirTable(req, res) {
    // CORS headers for browser requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Accept POST and PATCH requests
    if (req.method !== 'POST' && req.method !== 'PATCH') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const formData = req.body;
        const recordId = formData.airtable_record_id; // Get record ID if updating

        // Get AirTable credentials from environment variables
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appTll6JoqW04YvJs';
        const AIRTABLE_TABLE_NAME = 'Form Submissions';

        if (!AIRTABLE_API_KEY) {
            throw new Error('AirTable API key not configured');
        }

        // Prepare the AirTable payload (raw data with all fields)
        const rawPayload = {
            // Contact Information
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            company_name: formData.company_name,
            customer_type: formData.customer_type,
            consent_checkbox: formData.consent_checkbox,

            // Classification
            direction: formData.direction,

            // Import Timing (conditional)
            ...(formData.direction === 'import' && {
                goods_location: formData.goods_location,
                arrival_method: formData.arrival_method,
                arrival_timeline: formData.arrival_timeline,
                customs_code_status: formData.customs_code_status,
                customs_code_number: formData.customs_code_number
            }),

            // Export-Specific (conditional)
            ...(formData.direction === 'export' && {
                export_service_needed: formData.export_service_needed,
                destination_country: formData.destination_country
            }),

            // Service Classification
            shipping_payment: formData.shipping_payment,
            local_delivery: formData.local_delivery,
            needs_port_delivery: formData.needs_port_delivery,
            delivery_address: formData.delivery_address,
            shipment_method: formData.shipment_method,
            container_type: formData.container_type,
            air_weight_category: formData.air_weight_category,

            // Cargo Details
            cargo_type: formData.cargo_type,
            cargo_details: formData.cargo_details,
            other_cargo_description: formData.other_cargo_description,
            personal_item_condition: formData.personal_item_condition,
            personal_item_mixed: formData.personal_item_mixed || false,
            requires_temperature_control: formData.requires_temperature_control || false,

            // Packing Information
            packing_info_combined: formData.packing_info_combined,

            // Document Status Tracking
            air_waybill_status: formData.document_status?.air_waybill,
            bill_of_lading_status: formData.document_status?.bill_of_lading,
            courier_receipt_status: formData.document_status?.courier_receipt,
            commercial_invoice_status: formData.document_status?.commercial_invoice,
            packing_list_status: formData.document_status?.packing_list,
            export_declaration_status: formData.document_status?.export_declaration,
            msds_status: formData.document_status?.msds,

            // System Fields
            status: formData.status || 'completed',
            session_id: formData.session_id,

            // Email Automation Tracking
            reminder_sent: false,
            follow_up_sent: false,
            sales_manager_notified: false,
            email_sequence_stage: 'none'
        };

        // Filter out empty strings and undefined values for AirTable
        // AirTable doesn't allow empty strings for single-select fields
        const cleanedFields = {};
        for (const [key, value] of Object.entries(rawPayload)) {
            // Include the field if:
            // - It's a boolean (even if false)
            // - It's a non-empty string
            // - It's defined and not null
            if (typeof value === 'boolean' || (value !== '' && value !== undefined && value !== null)) {
                cleanedFields[key] = value;
            }
        }

        const airtablePayload = {
            fields: cleanedFields
        };

        // Submit to AirTable (POST for new, PATCH for update)
        const isUpdate = recordId && recordId !== '';
        const airtableUrl = isUpdate
            ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${recordId}`
            : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

        const response = await fetch(airtableUrl, {
            method: isUpdate ? 'PATCH' : 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airtablePayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('AirTable API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to submit to AirTable');
        }

        const result = await response.json();

        // Return success response
        return res.status(200).json({
            success: true,
            recordId: result.id,
            message: 'Form submitted successfully'
        });

    } catch (error) {
        console.error('Submission error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

// Export for different platforms
module.exports = submitToAirTable;

// For Vercel serverless:
// module.exports = submitToAirTable;

// For Netlify Functions:
// exports.handler = async (event) => {
//     const req = {
//         method: event.httpMethod,
//         body: JSON.parse(event.body)
//     };
//     const res = {
//         setHeader: () => {},
//         status: (code) => ({
//             json: (data) => ({
//                 statusCode: code,
//                 body: JSON.stringify(data)
//             }),
//             end: () => ({ statusCode: code })
//         })
//     };
//     return await submitToAirTable(req, res);
// };
