/**
 * Easy Freight Customs Clearance Form
 * Intelligent multi-step form with dynamic routing
 * Updated logic based on user requirements
 */

class EasyFreightForm {
    constructor() {
        // Initialize form state
        this.currentStep = 1;
        this.totalSteps = 0;
        
        // Focus and typing state tracking
        this.isInputFocused = false;
        this.isUserTyping = false;
        this.lastInputTime = 0;
        this.lastUserInteraction = 0;
        this.typingDelay = 2000; // Wait 2 seconds after last input before allowing auto-advance
        this.interactionDelay = 1000; // Wait 1 second after any user interaction
        
        this.formData = {
            // Contact Information (Step 1)
            first_name: '',
            last_name: '',
            company_name: '',
            email: '',
            phone: '',
            consent_checkbox: false,
            
            // Classification (Step 2)
            direction: '', // import/export
            customer_type: '', // business/personal
            
            // Import-specific questions
            goods_location: '', // Only for imports
            arrival_method: '',
            arrival_timeline: '',
            
            // Service classification
            shipping_payment: '',
            local_delivery: '',
            shipment_method: '',
            container_type: '',
            air_weight_category: '',
            
            // Export-specific
            export_service_needed: '',
            destination_country: '',
            
            // Cargo details
            cargo_type: '',
            cargo_details: '', // free text field for general goods and other
            personal_item_condition: '', // used or new for personal items (can be both)
            personal_item_mixed: false, // checkbox for mixed new/used personal items
            other_cargo_description: '', // free text for Other option
            requires_temperature_control: false, // for food/beverages and hazardous
            needs_port_delivery: '', // yes/no for delivery from port/airport
            delivery_address: '', // optional address for local delivery/collection
            
            // Packing information (when packing list not available)
            packing_dimensions: '', // dimensions per pallet
            total_pallets: '', // total number of pallets
            pallet_weight: '', // weight per pallet and total
            packing_info_combined: '', // combined packing information field
            
            // Customs code
            customs_code_status: '',
            customs_code_number: '',
            
            // Document uploads
            documents: {},
            document_status: {},
            
            // Scoring
            urgency_score: 0,
            complexity_score: 0,
            readiness_score: 0,
            routing_decision: ''
        };
        
        // Form configuration
        this.steps = this.initializeSteps();
        this.totalSteps = this.steps.length;
        
        // Initialize DOM elements
        this.initializeDOM();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load saved data
        this.loadSavedData();
        
        // Render first step
        this.renderStep();
        
        // Auto-save removed
    }
    
    initializeSteps() {
        return [
            {
                id: 'contact_info',
                title: 'Your Contact Details',
                description: 'Let\'s start with your basic information',
                template: 'contact_template',
                validation: () => this.validateContact(),
                required: true
            },
            {
                id: 'classification',
                title: 'Service Classification',
                description: 'Tell us about your shipping needs',
                template: 'classification_template',
                validation: () => this.validateClassification(),
                required: true
            },
            {
                id: 'goods_location', 
                title: 'Goods Timing',
                description: 'This helps us prioritise your request',
                template: 'goods_location_template',
                validation: () => this.validateGoodsLocation(),
                required: true,
                showIf: () => this.formData.direction === 'import'
            },
            {
                id: 'arrival_details',
                title: 'Arrival Details',
                description: 'Additional information about your shipment',
                template: 'arrival_details_template',
                validation: () => this.validateArrivalDetails(),
                required: false,
                showIf: () => this.shouldShowArrivalDetails()
            },
            {
                id: 'shipping_method',
                title: 'Shipping Method',
                description: 'How are your goods being shipped?',
                template: 'shipping_method_template',
                validation: () => this.validateShippingMethod(),
                required: true,
                showIf: () => this.shouldShowServiceDetails()
            },
            {
                id: 'payment_terms',
                title: 'Payment Terms',
                description: 'Who pays for shipping?',
                template: 'payment_terms_template',
                validation: () => this.validatePaymentTerms(),
                required: true,
                showIf: () => this.shouldShowPaymentTerms()
            },
            {
                id: 'delivery_options',
                title: 'Delivery Requirements',
                description: 'Local delivery and transport options',
                template: 'delivery_options_template',
                validation: () => this.validateDeliveryOptions(),
                required: true,
                showIf: () => this.shouldShowDeliveryOptions()
            },
            {
                id: 'cargo_type',
                title: 'What Are You Shipping?',
                description: 'Help us understand your cargo requirements',
                template: 'cargo_type_template',
                validation: () => this.validateCargoType(),
                required: true
            },
            {
                id: 'document_upload',
                title: 'Document Upload',
                description: 'Upload required shipping and commercial documents',
                template: 'document_upload_template',
                validation: () => this.validateDocuments(),
                required: true
            },
            {
                id: 'customs_code',
                title: 'Customs Code',
                description: 'Customs Client Code information',
                template: 'customs_code_template',
                validation: () => this.validateCustomsCode(),
                required: true,
                showIf: () => this.formData.direction === 'import'
            },
            {
                id: 'review',
                title: 'Review Your Information',
                description: 'Please confirm your details are correct',
                template: 'review_template',
                validation: () => true,
                required: false
            }
        ];
    }
    
    initializeDOM() {
        this.formContent = document.getElementById('formContent');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.progressFill = document.getElementById('progressFill');
        this.currentStepEl = document.getElementById('currentStep');
        this.totalStepsEl = document.getElementById('totalSteps');
        this.timeEstimate = document.getElementById('timeEstimate');
        this.autoSaveIndicator = document.getElementById('autoSaveIndicator');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }
    
    setupEventListeners() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.submitBtn.addEventListener('click', () => this.submitForm());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextStep();
            } else if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousStep();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveData();
                this.showAutoSave();
            }
        });
        
        // Removed exit intent and beforeunload warnings
    }
    
    // Template rendering methods
    renderStep() {
        const step = this.steps[this.currentStep - 1];
        
        if (!step) {
            this.showResults();
            return;
        }
        
        // Check if current step should be visible
        if (step.showIf && !step.showIf()) {
            // Current step is not visible, find next visible step
            const visibleSteps = this.getVisibleSteps();
            if (visibleSteps.length > 0) {
                const firstVisibleStep = visibleSteps[0];
                const firstVisibleIndex = this.steps.findIndex(s => s.id === firstVisibleStep.id);
                this.currentStep = firstVisibleIndex + 1;
                this.renderStep();
                return;
            } else {
                this.showResults();
                return;
            }
        }
        
        // Update progress
        this.updateProgress();
        
        // Render step content
        const template = this.getStepTemplate(step);
        this.formContent.innerHTML = template;
        
        // Bind event listeners for the current step
        this.bindStepEvents(step);
        
        // Update navigation
        this.updateNavigation();
        
        // Scroll to top smoothly
        this.scrollToTop();
        
        // Auto-focus first input
        this.focusFirstInput();
    }
    
    getStepTemplate(step) {
        switch (step.template) {
            case 'contact_template':
                return this.contactTemplate();
            case 'classification_template':
                return this.classificationTemplate();
            case 'goods_location_template':
                return this.goodsLocationTemplate();
            case 'arrival_details_template':
                return this.arrivalDetailsTemplate();
            case 'shipping_method_template':
                return this.shippingMethodTemplate();
            case 'payment_terms_template':
                return this.paymentTermsTemplate();
            case 'delivery_options_template':
                return this.deliveryOptionsTemplate();
            case 'cargo_type_template':
                return this.cargoTypeTemplate();

            case 'document_upload_template':
                return this.documentUploadTemplate();
            case 'customs_code_template':
                return this.customsCodeTemplate();
            case 'review_template':
                return this.reviewTemplate();
            default:
                return '<div>Template not found</div>';
        }
    }
    
    contactTemplate() {
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">1</div>
                    <h2 class="step-title">Contact Information</h2>
                    <p class="step-description">Your basic details for quick contact</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Your Name *
                    </label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <input 
                                type="text" 
                                id="first_name" 
                                class="form-input" 
                                placeholder="First name"
                                value="${this.formData.first_name}"
                                required
                            >
                            <div class="error-message" id="first_name_error"></div>
                        </div>
                        <div class="form-group">
                            <input 
                                type="text" 
                                id="last_name" 
                                class="form-input" 
                                placeholder="Last name"
                                value="${this.formData.last_name}"
                                required
                            >
                            <div class="error-message" id="last_name_error"></div>
                        </div>
                    </div>
                </div>
                
                <div class="question">
                    <label class="question-label" for="email">
                        Email Address *
                    </label>
                    <div class="form-group">
                        <input 
                            type="email" 
                            id="email" 
                            class="form-input" 
                            placeholder="your@email.com"
                            value="${this.formData.email}"
                            required
                        >
                        <div class="error-message" id="email_error"></div>
                    </div>
                </div>
                
                <div class="question">
                    <label class="question-label" for="phone">
                        Phone Number *
                    </label>
                    <div class="form-group">
                        <input 
                            type="tel" 
                            id="phone" 
                            class="form-input" 
                            placeholder="+64 21 123 4567"
                            value="${this.formData.phone}"
                            required
                        >
                        <div class="error-message" id="phone_error"></div>
                    </div>
                </div>
                
                <div class="question">
                    <div class="form-group">
                        <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; font-size: 0.875rem; line-height: 1.4;">
                            <input 
                                type="checkbox" 
                                id="consent_checkbox" 
                                ${this.formData.consent_checkbox ? 'checked' : ''}
                                style="margin-top: 0.125rem; flex-shrink: 0;"
                            >
                            <span>
                                I consent to Easy Freight collecting and using my personal information to prepare an estimate and contact me about my quote request.*
                            </span>
                        </label>
                        <div class="error-message" id="consent_checkbox_error"></div>
                    </div>
                </div>

            </div>
        `;
    }
    
    classificationTemplate() {
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">2</div>
                    <h2 class="step-title">Service Type</h2>
                    <p class="step-description">Import/Export & Customer Type</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        What service(s) do you need? *
                    </label>
                    <div class="radio-group two-columns">
                        <div class="radio-card ${this.formData.direction === 'import' ? 'selected' : ''}">
                            <input type="radio" name="direction" value="import" class="radio-input" ${this.formData.direction === 'import' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">To New Zealand</div>
                                <div class="radio-description">Bringing goods into New Zealand from overseas</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.direction === 'export' ? 'selected' : ''}">
                            <input type="radio" name="direction" value="export" class="radio-input" ${this.formData.direction === 'export' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">From New Zealand</div>
                                <div class="radio-description">Sending goods from New Zealand overseas</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="direction_error"></div>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Is this for business or personal use? *
                    </label>
                    <div class="radio-group two-columns">
                        <div class="radio-card ${this.formData.customer_type === 'business' ? 'selected' : ''}">
                            <input type="radio" name="customer_type" value="business" class="radio-input" ${this.formData.customer_type === 'business' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Business/Commercial/Sole Trader</div>
                                <div class="radio-description">Company imports, commercial goods, business activities</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.customer_type === 'personal' ? 'selected' : ''}">
                            <input type="radio" name="customer_type" value="personal" class="radio-input" ${this.formData.customer_type === 'personal' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Personal/Individual</div>
                                <div class="radio-description">Personal purchases, gifts, household items</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="customer_type_error"></div>
                </div>
                
                <!-- Company Name Field - Shows when Business is selected -->
                <div class="question ${this.formData.customer_type === 'business' ? 'show' : 'hide'}" id="company_name_section">
                    <label class="question-label" for="company_name">
                        Company Name *
                    </label>
                    <div class="form-group">
                        <input 
                            type="text" 
                            id="company_name" 
                            class="form-input" 
                            placeholder="e.g. ABC Company Ltd"
                            value="${this.formData.company_name}"
                            required
                        >
                        <div class="error-message" id="company_name_error"></div>
                    </div>
                    </div>
                    <div class="error-message" id="customer_type_error"></div>
                </div>
            </div>
        `;
    }
    
    goodsLocationTemplate() {
        // Step 3 Logic: 3 main categories for business routing
        // 1. URGENT: 'arrived' - immediate priority (Priority 1)
        // 2. IN TRANSIT: '1_2_days', '1_week', 'more_than_week' - goods are coming (Priority 2-4)
        // 3. NOT SHIPPED: 'not_shipped_yet' - planning/educational phase (Priority 4/Educational)
        
        const isImport = this.formData.direction === 'import';
        const stepTitle = isImport ? 'When are you expecting your goods?' : 'When do you need to ship your goods?';
        const questionLabel = isImport ? 'Expected arrival timing: *' : 'Required shipping timing: *';
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">3</div>
                    <h2 class="step-title">${stepTitle}</h2>
                    <p class="step-description">This helps us prioritise your request and provide accurate service</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        ${questionLabel}
                    </label>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.goods_location === 'arrived' ? 'selected' : ''}">
                            <input type="radio" name="goods_location" value="arrived" class="radio-input" ${this.formData.goods_location === 'arrived' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Arrived</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.goods_location === '1_2_days' ? 'selected' : ''}">
                            <input type="radio" name="goods_location" value="1_2_days" class="radio-input" ${this.formData.goods_location === '1_2_days' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Arriving within 48 hours</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.goods_location === '1_week' ? 'selected' : ''}">
                            <input type="radio" name="goods_location" value="1_week" class="radio-input" ${this.formData.goods_location === '1_week' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Arriving within one week</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.goods_location === 'more_than_week' ? 'selected' : ''}">
                            <input type="radio" name="goods_location" value="more_than_week" class="radio-input" ${this.formData.goods_location === 'more_than_week' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">More than a week</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.goods_location === 'not_shipped_yet' ? 'selected' : ''}">
                            <input type="radio" name="goods_location" value="not_shipped_yet" class="radio-input" ${this.formData.goods_location === 'not_shipped_yet' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Not shipped yet</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="goods_location_error"></div>
                </div>
            </div>
        `;
    }
    
    arrivalDetailsTemplate() {
        let content = `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">4</div>
                    <h2 class="step-title">Arrival Details</h2>
                    <p class="step-description">Additional information about your shipment</p>
                </div>
        `;
        
        if (this.formData.goods_location === 'arrived_nz') {
            content += `
                <div class="question">
                    <label class="question-label">
                        How did your goods arrive in New Zealand? *
                    </label>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.arrival_method === 'sea_port' ? 'selected' : ''}">
                            <input type="radio" name="arrival_method" value="sea_port" class="radio-input" ${this.formData.arrival_method === 'sea_port' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Sea freight (Port)</div>
                                <div class="radio-description">Auckland/Wellington/Christchurch Port</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.arrival_method === 'air_freight' ? 'selected' : ''}">
                            <input type="radio" name="arrival_method" value="air_freight" class="radio-input" ${this.formData.arrival_method === 'air_freight' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Air freight</div>
                                <div class="radio-description">Auckland Airport</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.arrival_method === 'courier' ? 'selected' : ''}">
                            <input type="radio" name="arrival_method" value="courier" class="radio-input" ${this.formData.arrival_method === 'courier' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">📮 NZ Post/Courier</div>
                                <div class="radio-description">Small package delivery</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.arrival_method === 'other' ? 'selected' : ''}">
                            <input type="radio" name="arrival_method" value="other" class="radio-input" ${this.formData.arrival_method === 'other' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Other location</div>
                                <div class="radio-description">Different arrival method</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="arrival_method_error"></div>
                </div>
            `;
        }
        
        if (this.formData.goods_location === 'in_transit') {
            content += `
                <div class="question">
                    <label class="question-label">
                        When are they expected to arrive? *
                    </label>
                    <div class="radio-group">
                        <div class="radio-card urgent ${this.formData.arrival_timeline === 'within_week' ? 'selected' : ''}">
                            <input type="radio" name="arrival_timeline" value="within_week" class="radio-input" ${this.formData.arrival_timeline === 'within_week' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">🚨 Within 1 week</div>
                                <div class="radio-description">Urgent preparation needed</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.arrival_timeline === '1_4_weeks' ? 'selected' : ''}">
                            <input type="radio" name="arrival_timeline" value="1_4_weeks" class="radio-input" ${this.formData.arrival_timeline === '1_4_weeks' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">📅 1-4 weeks</div>
                                <div class="radio-description">Standard processing timeline</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.arrival_timeline === 'over_month' ? 'selected' : ''}">
                            <input type="radio" name="arrival_timeline" value="over_month" class="radio-input" ${this.formData.arrival_timeline === 'over_month' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">📆 More than 1 month</div>
                                <div class="radio-description">Plenty of time for preparation</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="arrival_timeline_error"></div>
                </div>
            `;
        }
        
        content += '</div>';
        return content;
    }
    
    shippingMethodTemplate() {
        const stepNumber = this.getVisibleSteps().findIndex(step => step.id === 'shipping_method') + 1;
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Shipping Method</h2>
                    <p class="step-description">How are your goods being shipped?</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Select shipping method: *
                    </label>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.shipment_method === 'sea_freight' ? 'selected' : ''}">
                            <input type="radio" name="shipment_method" value="sea_freight" class="radio-input" ${this.formData.shipment_method === 'sea_freight' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Sea Freight</div>
                                <div class="radio-description">Container shipping - most economical for large shipments</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.shipment_method === 'air_freight' ? 'selected' : ''}">
                            <input type="radio" name="shipment_method" value="air_freight" class="radio-input" ${this.formData.shipment_method === 'air_freight' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Air Freight</div>
                                <div class="radio-description">Faster delivery for time-sensitive shipments</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.shipment_method === 'courier' ? 'selected' : ''}">
                            <input type="radio" name="shipment_method" value="courier" class="radio-input" ${this.formData.shipment_method === 'courier' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Courier/Express</div>
                                <div class="radio-description">Small packages and documents</div>
                            </div>
                        </div>
                        ${this.formData.goods_location === 'not_shipped_yet' ? `
                        <div class="radio-card ${this.formData.shipment_method === 'not_sure' ? 'selected' : ''}">
                            <input type="radio" name="shipment_method" value="not_sure" class="radio-input" ${this.formData.shipment_method === 'not_sure' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Not sure</div>
                                <div class="radio-description">I need advice on the best shipping method</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="error-message" id="shipment_method_error"></div>
                </div>
                
                ${this.formData.shipment_method === 'sea_freight' ? this.renderSeaFreightOptions() : ''}
            </div>
        `;
    }
    
    paymentTermsTemplate() {
        const stepNumber = this.getVisibleSteps().findIndex(step => step.id === 'payment_terms') + 1;
        
        if (this.formData.direction === 'import') {
            return this.importPaymentTermsTemplate(stepNumber);
        } else {
            return this.exportPaymentTermsTemplate(stepNumber);
        }
    }
    
    renderSeaFreightOptions() {
        return `
            <div class="question">
                <label class="question-label">
                    Container type: *
                </label>
                <p class="question-description">Choose based on your shipment size</p>
                <div class="radio-group two-columns">
                    <div class="radio-card ${this.formData.container_type === 'lcl' ? 'selected' : ''}">
                        <input type="radio" name="container_type" value="lcl" class="radio-input" ${this.formData.container_type === 'lcl' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">LCL (Less than Container Load)</div>
                            <div class="radio-description">Share container space with other shipments - includes customs clearance service</div>
                        </div>
                    </div>
                    <div class="radio-card ${this.formData.container_type === 'fcl' ? 'selected' : ''}">
                        <input type="radio" name="container_type" value="fcl" class="radio-input" ${this.formData.container_type === 'fcl' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">FCL (Full Container Load)</div>
                            <div class="radio-description">Exclusive container use - freight forwarding service required</div>
                        </div>
                    </div>
                </div>
                <div class="error-message" id="container_type_error"></div>
            </div>
        `;
    }
    
    importPaymentTermsTemplate(stepNumber) {
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Payment Terms</h2>
                    <p class="step-description">Who's paying for shipping to New Zealand?</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Shipping payment responsibility: *
                    </label>
                    <p class="question-description">This determines what services you need from us</p>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.shipping_payment === 'supplier_pays_cif' ? 'selected' : ''}">
                            <input type="radio" name="shipping_payment" value="supplier_pays_cif" class="radio-input" ${this.formData.shipping_payment === 'supplier_pays_cif' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Supplier arranges shipping to New Zealand</div>
                                <div class="radio-description">I just need NZ customs clearance (CIF/DDU)${this.formData.goods_location !== 'not_shipped_yet' ? '<br><small style="font-size: var(--font-size-xs); opacity: 0.7;">Most common option</small>' : ''}</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.shipping_payment === 'customer_pays_fob' ? 'selected' : ''}">
                            <input type="radio" name="shipping_payment" value="customer_pays_fob" class="radio-input" ${this.formData.shipping_payment === 'customer_pays_fob' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">I arrange shipping to New Zealand from origin port</div>
                                <div class="radio-description">I need shipping + NZ customs clearance (FOB)${this.formData.goods_location !== 'not_shipped_yet' ? '<br><small style="font-size: var(--font-size-xs); opacity: 0.7;">Better freight rates</small>' : ''}</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.shipping_payment === 'customer_pays_exw' ? 'selected' : ''}">
                            <input type="radio" name="shipping_payment" value="customer_pays_exw" class="radio-input" ${this.formData.shipping_payment === 'customer_pays_exw' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">I arrange everything from supplier's door</div>
                                <div class="radio-description">I need origin services + shipping + NZ customs clearance${this.formData.goods_location !== 'not_shipped_yet' ? '<br><small style="font-size: var(--font-size-xs); opacity: 0.7;">(EXW/FCA) Full control</small>' : ''}</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.shipping_payment === 'not_sure' ? 'selected' : ''}">
                            <input type="radio" name="shipping_payment" value="not_sure" class="radio-input" ${this.formData.shipping_payment === 'not_sure' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Not sure/Other arrangement</div>
                                <div class="radio-description">Need guidance on shipping terms</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="shipping_payment_error"></div>
                </div>
            </div>
        `;
    }
    
    exportPaymentTermsTemplate(stepNumber) {
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Export Services</h2>
                    <p class="step-description">What export services do you need?</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Export service type: *
                    </label>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.export_service_needed === 'shipping_and_clearance' ? 'selected' : ''}">
                            <input type="radio" name="export_service_needed" value="shipping_and_clearance" class="radio-input" ${this.formData.export_service_needed === 'shipping_and_clearance' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">🚢 Shipping + Clearance</div>
                                <div class="radio-description">Arrange shipping and export documentation</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.export_service_needed === 'clearance_only' ? 'selected' : ''}">
                            <input type="radio" name="export_service_needed" value="clearance_only" class="radio-input" ${this.formData.export_service_needed === 'clearance_only' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">📋 Only Clearance</div>
                                <div class="radio-description">Export documentation only (I have shipping arranged)</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.export_service_needed === 'not_sure' ? 'selected' : ''}">
                            <input type="radio" name="export_service_needed" value="not_sure" class="radio-input" ${this.formData.export_service_needed === 'not_sure' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Not sure</div>
                                <div class="radio-description">Need guidance on export requirements</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="export_service_needed_error"></div>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Destination country: *
                    </label>
                    <div class="form-group">
                        <select id="destination_country" class="form-input">
                            <option value="">Select destination country</option>
                            <option value="australia" ${this.formData.destination_country === 'australia' ? 'selected' : ''}>Australia</option>
                            <option value="usa" ${this.formData.destination_country === 'usa' ? 'selected' : ''}>United States</option>
                            <option value="uk" ${this.formData.destination_country === 'uk' ? 'selected' : ''}>United Kingdom</option>
                            <option value="canada" ${this.formData.destination_country === 'canada' ? 'selected' : ''}>Canada</option>
                            <option value="japan" ${this.formData.destination_country === 'japan' ? 'selected' : ''}>Japan</option>
                            <option value="china" ${this.formData.destination_country === 'china' ? 'selected' : ''}>China</option>
                            <option value="singapore" ${this.formData.destination_country === 'singapore' ? 'selected' : ''}>Singapore</option>
                            <option value="germany" ${this.formData.destination_country === 'germany' ? 'selected' : ''}>Germany</option>
                            <option value="france" ${this.formData.destination_country === 'france' ? 'selected' : ''}>France</option>
                            <option value="other" ${this.formData.destination_country === 'other' ? 'selected' : ''}>Other country</option>
                        </select>
                        <div class="error-message" id="destination_country_error"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    deliveryOptionsTemplate() {
        const stepNumber = this.getVisibleSteps().findIndex(step => step.id === 'delivery_options') + 1;
        const isExport = this.formData.direction === 'export';
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Delivery Requirements</h2>
                    <p class="step-description">${isExport ? 
                        'How will your goods get to the shipping port/airport?' : 
                        'Do you need delivery from port/airport to your address?'}</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        ${isExport ? 'Collection service:' : 'Local delivery service:'} *
                    </label>
                    <div class="radio-group two-columns">
                        <div class="radio-card ${this.formData.needs_port_delivery === 'yes' ? 'selected' : ''}">
                            <input type="radio" name="needs_port_delivery" value="yes" class="radio-input" ${this.formData.needs_port_delivery === 'yes' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">${isExport ? 'Yes, pick up from my address' : 'Yes, deliver to my address'}</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.needs_port_delivery === 'no' ? 'selected' : ''}">
                            <input type="radio" name="needs_port_delivery" value="no" class="radio-input" ${this.formData.needs_port_delivery === 'no' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">${isExport ? 'No, I\'ll deliver to shipping port' : 'No, I\'ll collect myself'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="needs_port_delivery_error"></div>
                </div>
                
                ${this.formData.needs_port_delivery === 'yes' ? `
                <div class="question" style="margin-top: var(--spacing-md);">
                    <label class="question-label" for="delivery_address">
                        ${isExport ? 'Collection Address (Optional):' : 'Delivery Address (Optional):'}
                    </label>
                    <textarea 
                        id="delivery_address" 
                        name="delivery_address"
                        class="form-input" 
                        rows="3"
                        placeholder="${isExport ? 'Enter collection address...' : 'Enter delivery address...'}"
                        style="resize: vertical;"
                    >${this.formData.delivery_address || ''}</textarea>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    cargoTypeTemplate() {
        const isBusinessUser = this.formData.customer_type === 'business';
        const personalItemsLabel = isBusinessUser ? 
            'Personal belongings (used items)' : 
            'Personal effects/household goods';
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">6</div>
                    <h2 class="step-title">What Are You Shipping?</h2>
                    <p class="step-description">Help us understand your cargo requirements</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Type of goods: *
                    </label>
                    <div class="radio-group">
                        <div class="radio-card ${this.formData.cargo_type === 'general_goods' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="general_goods" class="radio-input" ${this.formData.cargo_type === 'general_goods' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">General goods</div>
                                <div class="radio-description">Electronics, clothing, light equipment, tools, etc.</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.cargo_type === 'food_beverages' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="food_beverages" class="radio-input" ${this.formData.cargo_type === 'food_beverages' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Food & beverages</div>
                                <div class="radio-description">Biosecurity clearance required</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.cargo_type === 'personal_effects' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="personal_effects" class="radio-input" ${this.formData.cargo_type === 'personal_effects' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">${personalItemsLabel}</div>
                                <div class="radio-description">Furniture, clothes, personal items</div>
                            </div>
                        </div>
                        ${this.formData.shipment_method !== 'courier' ? `
                        <div class="radio-card ${this.formData.cargo_type === 'vehicles_machinery' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="vehicles_machinery" class="radio-input" ${this.formData.cargo_type === 'vehicles_machinery' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Vehicles/machinery</div>
                                <div class="radio-description">Cars, heavy equipment, industrial machines</div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="radio-card ${this.formData.cargo_type === 'chemicals_dangerous' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="chemicals_dangerous" class="radio-input" ${this.formData.cargo_type === 'chemicals_dangerous' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Hazardous goods</div>
                                <div class="radio-description">Batteries, flammables, chemicals</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.cargo_type === 'other' ? 'selected' : ''}">
                            <input type="radio" name="cargo_type" value="other" class="radio-input" ${this.formData.cargo_type === 'other' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Other</div>
                                <div class="radio-description">Please specify below</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="error-message" id="cargo_type_error"></div>
                    ${this.renderCargoTypeQuestions()}
                </div>
            </div>
        `;
    }
    
    customsCodeTemplate() {
        const stepNumber = this.getVisibleSteps().findIndex(step => step.id === 'customs_code') + 1;
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Customs Code</h2>
                    <p class="step-description">Customs Client Code information for import clearance</p>
                </div>
                
                ${this.renderCustomsCodeSection()}
            </div>
        `;
    }
    
    renderCargoTypeQuestions() {
        let clarificationQuestions = '';
        
        // General goods - Optional details field
        if (this.formData.cargo_type === 'general_goods') {
            clarificationQuestions += `
                <div class="question" style="margin-top: var(--spacing-sm); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                    <label class="question-label" style="color: var(--primary-color); font-weight: 600;">
                        Tell us more about your general goods (Optional):
                    </label>
                    <input 
                        type="text" 
                        id="cargo_details" 
                        class="form-input" 
                        placeholder="e.g., Specific type of electronics, tools, etc."
                        value="${this.formData.cargo_details || ''}"
                        style="margin-top: var(--spacing-xs);"
                    >
                </div>
            `;
        }
        
        // Personal items - Used or New question (now with checkbox for mixed)
        if (this.formData.cargo_type === 'personal_effects') {
            clarificationQuestions += `
                <div class="question" style="margin-top: var(--spacing-sm); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                    <label class="question-label" style="color: var(--primary-color); font-weight: 600;">
                        <i class="fas fa-home"></i> Are these personal items used or new? *
                    </label>
                    <div class="radio-group two-columns" style="margin-bottom: var(--spacing-sm);">
                        <div class="radio-card ${this.formData.personal_item_condition === 'used' ? 'selected' : ''}">
                            <input type="radio" name="personal_item_condition" value="used" class="radio-input" ${this.formData.personal_item_condition === 'used' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Used items</div>
                                <div class="radio-description">Previously owned</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.personal_item_condition === 'new' ? 'selected' : ''}">
                            <input type="radio" name="personal_item_condition" value="new" class="radio-input" ${this.formData.personal_item_condition === 'new' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">New items</div>
                                <div class="radio-description">Brand new purchases</div>
                            </div>
                        </div>
                    </div>
                    
                    <label class="checkbox-label" style="display: flex; align-items: center; gap: var(--spacing-xs); font-size: var(--font-size-sm);">
                        <input 
                            type="checkbox" 
                            id="personal_item_mixed" 
                            ${this.formData.personal_item_mixed ? 'checked' : ''}
                            style="margin: 0;"
                        >
                        <span>I have both new and used items</span>
                    </label>
                    <div class="error-message" id="personal_item_condition_error"></div>
                </div>
            `;
        }
        
        // Vehicles/machinery - Used or New question (with checkbox for mixed)
        if (this.formData.cargo_type === 'vehicles_machinery') {
            clarificationQuestions += `
                <div class="question" style="margin-top: var(--spacing-sm); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                    <label class="question-label" style="color: var(--primary-color); font-weight: 600;">
                        <i class="fas fa-car"></i> Are these vehicles/machinery used or new? *
                    </label>
                    <div class="radio-group two-columns" style="margin-bottom: var(--spacing-sm);">
                        <div class="radio-card ${this.formData.personal_item_condition === 'used' ? 'selected' : ''}">
                            <input type="radio" name="personal_item_condition" value="used" class="radio-input" ${this.formData.personal_item_condition === 'used' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Used items</div>
                                <div class="radio-description">Previously owned</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.personal_item_condition === 'new' ? 'selected' : ''}">
                            <input type="radio" name="personal_item_condition" value="new" class="radio-input" ${this.formData.personal_item_condition === 'new' ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">New items</div>
                                <div class="radio-description">Brand new vehicles/machinery</div>
                            </div>
                        </div>
                    </div>
                    
                    <label class="checkbox-label" style="display: flex; align-items: center; gap: var(--spacing-xs); font-size: var(--font-size-sm);">
                        <input 
                            type="checkbox" 
                            id="vehicle_item_mixed" 
                            ${this.formData.personal_item_mixed ? 'checked' : ''}
                            style="margin: 0;"
                        >
                        <span>I have both new and used items</span>
                    </label>
                    <div class="error-message" id="personal_item_condition_error"></div>
                </div>
            `;
        }
        
        // Temperature control question - Only for food/beverages (removed from hazardous)
        if (this.formData.cargo_type === 'food_beverages') {
            clarificationQuestions += `
                <div class="question" style="margin-top: var(--spacing-sm); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                    <label class="question-label" style="color: var(--primary-color); font-weight: 600;">
                        <i class="fas fa-thermometer-half"></i> Does this cargo require temperature control/refrigeration? *
                    </label>
                    <div class="radio-group two-columns">
                        <div class="radio-card ${this.formData.requires_temperature_control === true ? 'selected' : ''}">
                            <input type="radio" name="requires_temperature_control" value="true" class="radio-input" ${this.formData.requires_temperature_control === true ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">Yes, temperature controlled</div>
                                <div class="radio-description">Requires refrigeration/freezing</div>
                            </div>
                        </div>
                        <div class="radio-card ${this.formData.requires_temperature_control === false ? 'selected' : ''}">
                            <input type="radio" name="requires_temperature_control" value="false" class="radio-input" ${this.formData.requires_temperature_control === false ? 'checked' : ''}>
                            <div class="radio-icon"></div>
                            <div class="radio-content">
                                <div class="radio-title">No, standard temperature</div>
                                <div class="radio-description">Room temperature handling</div>
                            </div>
                        </div>
                    </div>
                    <div class="error-message" id="requires_temperature_control_error"></div>
                </div>
            `;
        }
        
        // Other cargo type - Free text description
        if (this.formData.cargo_type === 'other') {
            clarificationQuestions += `
                <div class="question" style="margin-top: var(--spacing-sm); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                    <label class="question-label" style="color: var(--primary-color); font-weight: 600;">
                        <i class="fas fa-edit"></i> Please specify what you are shipping: *
                    </label>
                    <textarea 
                        id="other_cargo_description" 
                        class="form-input" 
                        rows="3"
                        placeholder="Please describe your cargo type, quantity, and any special requirements..."
                        style="margin-top: var(--spacing-xs); resize: vertical;"
                    >${this.formData.other_cargo_description || ''}</textarea>
                    <div class="error-message" id="other_cargo_description_error"></div>
                </div>
            `;
        }
        
        return clarificationQuestions;
    }

    
    customsCodeSection() {
        return `
            <div class="question" style="margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 0.75rem; border-left: 4px solid var(--primary-color);">
                <h4 style="margin-bottom: 1rem; color: var(--primary-color);">
                    <i class="fas fa-info-circle"></i>
                    NZ Customs Client Code Required
                </h4>
                <div class="radio-group" style="margin-top: 1rem;">
                    <div class="radio-card ${this.formData.customs_code_status === 'have_code' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="have_code" class="radio-input" ${this.formData.customs_code_status === 'have_code' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I have a Customs Client Code</div>
                            <div class="radio-description">Ready to proceed with clearance</div>
                        </div>
                    </div>
                    <div class="radio-card ${this.formData.customs_code_status === 'need_help' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="need_help" class="radio-input" ${this.formData.customs_code_status === 'need_help' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I need help getting one</div>
                            <div class="radio-description">Additional charge apply (+ NZD 95 +GST)</div>
                        </div>
                    </div>
                    <div class="radio-card ${this.formData.customs_code_status === 'apply_myself' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="apply_myself" class="radio-input" ${this.formData.customs_code_status === 'apply_myself' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I'll apply myself</div>
                            <div class="radio-description">I will handle the Customs Client Code application independently</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    documentUploadTemplate() {
        const documentsNeeded = this.getRequiredDocuments();
        const stepNumber = this.getVisibleSteps().findIndex(step => step.id === 'document_upload') + 1;
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${stepNumber}</div>
                    <h2 class="step-title">Document Upload</h2>
                    <p class="step-description">Upload required shipping and commercial documents</p>
                </div>
                
                <div class="question">
                    <label class="question-label">
                        Required Documents
                    </label>
                    <p class="question-description">
                        Upload your documents to help us process your request faster.
                    </p>
                    
                    <div class="file-upload-section">
                        ${documentsNeeded.map(doc => this.renderDocumentUpload(doc)).join('')}
                    </div>
                    <div class="error-message document-general-error" style="display: none;"></div>
                </div>
            </div>
        `;
    }
    
    renderCustomsCodeSection() {
        return `
            <div class="question" style="margin-top: var(--spacing-md); padding: var(--spacing-md); background: #f8f9fa; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                <h4 style="margin-bottom: var(--spacing-sm); color: var(--primary-color); font-size: var(--font-size-base); font-weight: 600;">
                    <i class="fas fa-id-card"></i>
                    NZ Customs Client Code
                </h4>
                <p style="margin-bottom: var(--spacing-sm); color: var(--text-secondary); font-size: var(--font-size-xs);">
                    A Customs Client Code is required for all imports to New Zealand.
                </p>
                
                <div class="radio-group" style="margin-bottom: var(--spacing-sm);">
                    <div class="radio-card ${this.formData.customs_code_status === 'have_code' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="have_code" class="radio-input" ${this.formData.customs_code_status === 'have_code' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I have a Customs Client Code</div>
                            <div class="radio-description">Ready to proceed with clearance</div>
                        </div>
                    </div>
                    <div class="radio-card ${this.formData.customs_code_status === 'need_help' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="need_help" class="radio-input" ${this.formData.customs_code_status === 'need_help' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I need help getting one</div>
                            <div class="radio-description">Additional charge apply (+ NZD 95 +GST)</div>
                        </div>
                    </div>
                    <div class="radio-card ${this.formData.customs_code_status === 'apply_myself' ? 'selected' : ''}">
                        <input type="radio" name="customs_code_status" value="apply_myself" class="radio-input" ${this.formData.customs_code_status === 'apply_myself' ? 'checked' : ''}>
                        <div class="radio-icon"></div>
                        <div class="radio-content">
                            <div class="radio-title">I'll apply myself</div>
                            <div class="radio-description">I will handle the Customs Client Code application independently</div>
                        </div>
                    </div>
                </div>
                
                ${this.formData.customs_code_status === 'have_code' ? `
                    <div style="margin-top: var(--spacing-sm);">
                        <label style="display: block; font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--text-primary); font-size: var(--font-size-sm);">
                            Enter your 8-character Customs Client Code: *
                        </label>
                        <input 
                            type="text" 
                            id="customs_code_number" 
                            class="form-input" 
                            placeholder="e.g. ABC12345"
                            value="${this.formData.customs_code_number || ''}"
                            maxlength="8"
                            style="max-width: 200px; text-transform: uppercase;"
                        >
                        <div class="error-message" id="customs_code_number_error"></div>
                    </div>
                ` : ''}
                
                <div class="error-message" id="customs_code_status_error"></div>
            </div>
        `;
    }
    
    getRequiredDocuments() {
        const documents = [];
        
        if (this.formData.direction === 'import') {
            // Shipping documents - Hide for "not shipped yet" educational pathway
            if (this.formData.goods_location !== 'not_shipped_yet') {
                if (this.formData.shipment_method === 'air_freight') {
                    documents.push({
                        id: 'air_waybill',
                        title: '📄 Air Waybill',
                        required: true,
                        description: 'Air transport document with tracking number'
                    });
                } else if (this.formData.shipment_method === 'sea_freight') {
                    documents.push({
                        id: 'bill_of_lading',
                        title: '📄 Bill of Lading',
                        required: true,
                        description: 'Sea transport document proving ownership'
                    });
                } else if (this.formData.shipment_method === 'courier') {
                    documents.push({
                        id: 'courier_receipt',
                        title: '📦 Courier Receipt/Tracking',
                        required: true,
                        description: 'Courier service tracking document'
                    });
                }
            }
            
            // Commercial Invoice
            documents.push({
                id: 'commercial_invoice',
                title: '📄 Commercial Invoice or Draft Invoice',
                required: true,
                description: 'Invoice with item details and values',
                allowMultiple: true
            });
            
            // Packing List - Required only if delivery requested
            const isDeliveryRequested = this.formData.needs_port_delivery === 'yes';
            documents.push({
                id: 'packing_list',
                title: '📋 Packing List or Draft packing list',
                required: isDeliveryRequested,
                description: 'Detailed packing information',
                allowMultiple: true,
                allowSkip: true // This allows for text input alternative
            });
            
        } else {
            // Export documents
            documents.push({
                id: 'commercial_invoice',
                title: '📄 Commercial Invoice',
                required: true,
                description: 'Invoice with item details and values',
                allowMultiple: true
            });
            
            // Packing List (separate)
            documents.push({
                id: 'packing_list',
                title: '📋 Packing List',
                required: true,
                description: 'Detailed packing information',
                allowMultiple: true,
                allowSkip: true
            });
            
            documents.push({
                id: 'export_declaration',
                title: '📋 Export Declaration',
                required: true,
                description: 'Official export documentation'
            });
        }
        
        // MSDS for hazardous goods (both import and export)
        if (this.formData.cargo_type === 'chemicals_dangerous') {
            documents.push({
                id: 'msds',
                title: '📄 MSDS - Material Safety Data Sheet',
                required: true,
                description: 'Safety data sheet for hazardous materials',
                allowMultiple: true
            });
        }
        
        return documents;
    }
    
    renderDocumentUpload(doc) {
        // Special handling for packing list
        if (doc.id === 'packing_list') {
            return this.renderPackingListSection(doc);
        }
        
        return `
            <div class="file-upload-item">
                <div class="file-upload-header">
                    <div class="file-upload-title">
                        ${doc.title} ${doc.required ? '*' : ''}
                    </div>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    ${doc.description}
                </p>
                
                <div class="file-upload-options">
                    <button type="button" class="file-upload-btn ${this.formData.document_status[doc.id] === 'upload' ? 'selected' : ''}" 
                            data-doc="${doc.id}" data-action="upload">
                        <i class="fas fa-upload"></i>
                        Upload File${doc.allowMultiple ? 's' : ''}
                    </button>
                    <button type="button" class="file-upload-btn ${this.formData.document_status[doc.id] === 'dont_have' ? 'selected' : ''}" 
                            data-doc="${doc.id}" data-action="dont_have">
                        <i class="fas fa-clock"></i>
                        Don't have yet
                    </button>
                    ${(this.formData.direction === 'export' && doc.id !== 'export_declaration') ? `
                    <button type="button" class="file-upload-btn ${this.formData.document_status[doc.id] === 'need_help' ? 'selected' : ''}" 
                            data-doc="${doc.id}" data-action="need_help">
                        <i class="fas fa-question-circle"></i>
                        Need help creating
                    </button>
                    ` : ''}
                </div>
                
                <div class="uploaded-files" id="files_${doc.id}">
                    ${this.renderUploadedFiles(doc.id)}
                </div>
            </div>
        `;
    }
    
    renderPackingListSection(doc) {
        return `
            <div class="file-upload-item">
                <div class="file-upload-header">
                    <div class="file-upload-title">
                        ${doc.title} ${doc.required ? '*' : ''}
                    </div>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    ${doc.description}
                </p>
                
                <div class="file-upload-options">
                    <button type="button" class="file-upload-btn ${this.formData.document_status[doc.id] === 'upload' ? 'selected' : ''}" 
                            data-doc="${doc.id}" data-action="upload">
                        <i class="fas fa-upload"></i>
                        Upload Packing List
                    </button>
                    <button type="button" class="file-upload-btn ${this.formData.document_status[doc.id] === 'dont_have' ? 'selected' : ''}" 
                            data-doc="${doc.id}" data-action="dont_have">
                        <i class="fas fa-edit"></i>
                        Don't have one
                    </button>
                </div>
                
                <div class="uploaded-files" id="files_${doc.id}">
                    ${this.renderUploadedFiles(doc.id)}
                </div>
                
                ${this.formData.document_status[doc.id] === 'dont_have' ? this.renderPackingInfoForm() : ''}
            </div>
        `;
    }
    
    renderPackingInfoForm() {
        const isRequired = this.formData.needs_port_delivery === 'yes';
        const requiredText = isRequired ? ' Required *' : ' (Optional)';
        const backgroundColor = isRequired ? '#f8f9fa' : '#f0f8f0';
        const borderColor = isRequired ? 'var(--primary-color)' : '#28a745';
        
        return `
            <div style="margin-top: 1rem; padding: 1rem; background: ${backgroundColor}; border-radius: 0.5rem; border-left: 4px solid ${borderColor};">
                <h4 style="margin-bottom: 0.75rem; color: ${borderColor}; font-size: var(--font-size-sm);">
                    <i class="fas fa-info-circle"></i>
                    Packing Information${requiredText}
                </h4>
                <p style="margin-bottom: 1rem; font-size: var(--font-size-xs); color: #6c757d;">
                    ${isRequired ? 
                        'Please provide the following details (required for delivery service):' : 
                        'Optionally provide these details for a more accurate quote:'}
                </p>
                
                <div style="margin-bottom: 1rem;">
                    <button type="button" id="open-container-calculator" class="calculator-btn" 
                            style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-size: var(--font-size-sm); cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-calculator"></i>
                        Help me to calculate
                    </button>
                </div>
                
                <div class="form-group">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); font-size: var(--font-size-sm);">
                        Packing Details: ${isRequired ? '*' : '(Optional)'}
                    </label>
                    <textarea 
                        id="packing_info_combined" 
                        class="form-input" 
                        rows="6"
                        placeholder="Please include:
• Dimensions (Length x Width x Height in cm) per pallet/unit and total volume
• Total number of pallets/units  
• Weight (in kg) per pallet/unit and total weight of cargo

Example:
Each pallet: 120 x 100 x 150 cm, Total volume: 5.4 m³
Total: 3 pallets
Each pallet: 250 kg, Total weight: 750 kg"
                        style="resize: vertical; font-size: var(--font-size-sm); line-height: 1.4; color: #000000;"
                    >${this.formData.packing_info_combined || ''}</textarea>
                </div>
            </div>
        `;
    }
    

    
    renderUploadedFiles(docId) {
        const files = this.formData.documents[docId] || [];
        return files.map(file => `
            <div class="uploaded-file">
                <div class="uploaded-file-info">
                    <i class="fas fa-file-pdf"></i>
                    <div>
                        <div class="uploaded-file-name">${file.name}</div>
                        <div class="uploaded-file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="uploaded-file-remove" data-doc="${docId}" data-file="${file.name}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    reviewTemplate() {
        const visibleSteps = this.getVisibleSteps();
        const summary = this.generateSummary();
        const documentSummary = this.generateDocumentSummary();
        const packingInfo = this.generatePackingInfoSummary();
        
        return `
            <div class="step active">
                <div class="step-header">
                    <div class="step-number">${visibleSteps.length}</div>
                    <h2 class="step-title">Review Your Information</h2>
                    <p class="step-description">Please confirm your details are correct before submitting</p>
                </div>
                
                <div class="question">
                    <!-- Main Summary -->
                    <div style="background: #f8f9fa; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                            <i class="fas fa-clipboard-check"></i>
                            Request Summary
                        </h3>
                        
                        <div class="review-summary" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm);">
                            ${summary.map(item => `
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color); font-size: var(--font-size-xs);">
                                    <strong>${item.label}:</strong>
                                    <span style="text-align: right; margin-left: 1rem;">${item.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Document Summary -->
                    ${documentSummary.length > 0 ? `
                    <div style="background: #f8f9fa; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--primary-color);">
                            <i class="fas fa-file-alt"></i>
                            Document Status
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-sm);">
                            ${documentSummary.map(doc => `
                                <div style="display: flex; justify-content: space-between; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--border-color); font-size: var(--font-size-xs);">
                                    <strong>${doc.title}:</strong>
                                    <span style="text-align: right; margin-left: 1rem;">${doc.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Packing Information -->
                    ${packingInfo ? `
                    <div style="background: #f8f9fa; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--primary-color);">
                            <i class="fas fa-box"></i>
                            Packing Information
                        </h3>
                        <div style="background: #fff; padding: 1rem; border-radius: 4px; border: 1px solid #dee2e6;">
                            <p style="font-size: var(--font-size-sm); line-height: 1.6; color: #333; margin: 0; white-space: pre-wrap;">${packingInfo}</p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="background: linear-gradient(135deg, #fff3cd, #ffeaa7); border: 1px solid #ffc107; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: #856404; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-shield-alt"></i>
                            Important Legal Notice
                        </h4>
                        <p style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: #856404;">
                            By submitting this form, you agree to indemnify Easy Freight from any issues arising from information disclosed. 
                            You instruct Easy Freight to process the information provided to the best of their knowledge and experience. 
                            You acknowledge that customs requirements may change and additional information may be required during processing.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Validation methods
    validateContact() {
        let isValid = true;
        
        // First name validation
        if (!this.formData.first_name.trim()) {
            this.showFieldError('first_name', 'Please enter your first name');
            isValid = false;
        } else {
            this.clearFieldError('first_name');
        }
        
        // Last name validation
        if (!this.formData.last_name.trim()) {
            this.showFieldError('last_name', 'Please enter your last name');
            isValid = false;
        } else {
            this.clearFieldError('last_name');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.formData.email.trim()) {
            this.showFieldError('email', 'Please enter your email address');
            isValid = false;
        } else if (!emailRegex.test(this.formData.email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        } else {
            this.clearFieldError('email');
        }
        
        // Phone validation
        if (!this.formData.phone.trim()) {
            this.showFieldError('phone', 'Please enter your phone number');
            isValid = false;
        } else if (this.formData.phone.length < 8) {
            this.showFieldError('phone', 'Please enter a valid phone number');
            isValid = false;
        } else {
            this.clearFieldError('phone');
        }
        
        // Consent validation
        if (!this.formData.consent_checkbox) {
            this.showFieldError('consent_checkbox', 'Please provide consent to proceed with your quote request');
            isValid = false;
        } else {
            this.clearFieldError('consent_checkbox');
        }
        
        return isValid;
    }
    
    validateClassification() {
        let isValid = true;
        
        if (!this.formData.direction) {
            this.showFieldError('direction', 'Please select import or export');
            isValid = false;
        } else {
            this.clearFieldError('direction');
        }
        
        if (!this.formData.customer_type) {
            this.showFieldError('customer_type', 'Please select business or personal');
            isValid = false;
        } else {
            this.clearFieldError('customer_type');
        }
        
        // Validate company name if business is selected
        if (this.formData.customer_type === 'business' && !this.formData.company_name.trim()) {
            this.showFieldError('company_name', 'Please enter your company name');
            isValid = false;
        } else {
            this.clearFieldError('company_name');
        }
        
        // Update continue button state
        this.updateContinueButton();
        
        return isValid;
    }
    
    validateGoodsLocation() {
        if (!this.formData.goods_location) {
            this.showFieldError('goods_location', 'Please select where your goods are currently located');
            return false;
        }
        this.clearFieldError('goods_location');
        return true;
    }
    
    validateArrivalDetails() {
        if (this.formData.goods_location === 'arrived_nz' && !this.formData.arrival_method) {
            this.showFieldError('arrival_method', 'Please select how your goods arrived');
            return false;
        }
        
        if (this.formData.goods_location === 'in_transit' && !this.formData.arrival_timeline) {
            this.showFieldError('arrival_timeline', 'Please select expected arrival timeline');
            return false;
        }
        
        this.clearFieldError('arrival_method');
        this.clearFieldError('arrival_timeline');
        return true;
    }
    
    validateShippingMethod() {
        let isValid = true;
        
        if (!this.formData.shipment_method) {
            this.showFieldError('shipment_method', 'Please select shipping method');
            isValid = false;
        } else {
            this.clearFieldError('shipment_method');
        }
        
        // If sea freight is selected, also validate container type
        if (this.formData.shipment_method === 'sea_freight' && !this.formData.container_type) {
            this.showFieldError('container_type', 'Please select container type');
            isValid = false;
        } else {
            this.clearFieldError('container_type');
        }
        
        return isValid;
    }
    
    validatePaymentTerms() {
        let isValid = true;
        
        if (this.formData.direction === 'import') {
            if (!this.formData.shipping_payment) {
                this.showFieldError('shipping_payment', 'Please select who pays for shipping');
                isValid = false;
            } else {
                this.clearFieldError('shipping_payment');
            }
        } else {
            if (!this.formData.export_service_needed) {
                this.showFieldError('export_service_needed', 'Please select export service type');
                isValid = false;
            } else {
                this.clearFieldError('export_service_needed');
            }
            if (!this.formData.destination_country) {
                this.showFieldError('destination_country', 'Please select destination country');
                isValid = false;
            } else {
                this.clearFieldError('destination_country');
            }
        }
        
        return isValid;
    }
    
    validateDeliveryOptions() {
        let isValid = true;
        
        if (!this.formData.needs_port_delivery) {
            this.showFieldError('needs_port_delivery', 'Please select your delivery preference');
            isValid = false;
        } else {
            this.clearFieldError('needs_port_delivery');
        }
        
        return isValid;
    }
    
    validateCargoType() {
        let isValid = true;
        
        if (!this.formData.cargo_type) {
            this.showFieldError('cargo_type', 'Please select the type of goods you are shipping');
            isValid = false;
        } else {
            this.clearFieldError('cargo_type');
        }
        
        // Validate personal item condition if personal effects or vehicles/machinery selected
        if (this.formData.cargo_type === 'personal_effects' || this.formData.cargo_type === 'vehicles_machinery') {
            if (!this.formData.personal_item_condition) {
                this.showFieldError('personal_item_condition', 'Please specify if items are used or new');
                isValid = false;
            } else {
                this.clearFieldError('personal_item_condition');
            }
        }
        
        // Validate temperature control for food/beverages and hazardous goods
        if (this.formData.cargo_type === 'food_beverages' || this.formData.cargo_type === 'chemicals_dangerous') {
            if (this.formData.requires_temperature_control === '') {
                this.showFieldError('requires_temperature_control', 'Please specify if temperature control is required');
                isValid = false;
            } else {
                this.clearFieldError('requires_temperature_control');
            }
        }
        
        return isValid;
    }
    
    validateCustomsCode() {
        let isValid = true;
        
        if (!this.formData.customs_code_status) {
            this.showFieldError('customs_code_status', 'Please select if you have a Customs Client Code');
            isValid = false;
        } else {
            this.clearFieldError('customs_code_status');
        }
        
        // If they have a code, validate the input
        if (this.formData.customs_code_status === 'have_code') {
            if (!this.formData.customs_code_number || this.formData.customs_code_number.length !== 8) {
                this.showFieldError('customs_code_number', 'Please enter a valid 8-character Customs Client Code');
                isValid = false;
            } else {
                this.clearFieldError('customs_code_number');
            }
        }
        
        return isValid;
    }

    
    validateDocuments() {
        let isValid = true;
        const documents = this.getRequiredDocuments();
        
        // Check that at least one file is uploaded for required documents
        const requiredDocs = documents.filter(doc => doc.required);
        let hasAnyRequiredDoc = false;
        
        for (const doc of requiredDocs) {
            const files = this.formData.documents[doc.id] || [];
            const status = this.formData.document_status[doc.id];
            
            if (files.length > 0 || status === 'dont_have' || status === 'need_help') {
                hasAnyRequiredDoc = true;
            }
        }
        
        if (!hasAnyRequiredDoc) {
            // Show general error - need at least one document
            const errorEl = document.querySelector('.document-general-error');
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = 'Please upload at least one required document or indicate availability';
            }
            isValid = false;
        } else {
            const errorEl = document.querySelector('.document-general-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        }
        
        // Special validation for packing list text input
        if (this.formData.document_status['packing_list'] === 'dont_have') {
            // Packing information is only required if local delivery service is requested
            const isPackingRequired = this.formData.needs_port_delivery === 'yes';
            
            if (isPackingRequired && !this.formData.packing_info_combined.trim()) {
                this.showFieldError('packing_info_combined', 'Please provide packing information - required for delivery service');
                isValid = false;
            } else {
                this.clearFieldError('packing_info_combined');
            }
        }
        
        return isValid;
    }
    
    // Helper methods for conditional logic
    shouldShowArrivalDetails() {
        // No longer needed with new timing system
        return false;
    }
    
    shouldShowServiceDetails() {
        // Skip service details for certain routing decisions
        if (this.formData.goods_location === 'planning' || 
            this.formData.goods_location === 'ordered_not_shipped') {
            return false;
        }
        return true;
    }
    
    shouldShowPaymentTerms() {
        // Skip Incoterms if goods have arrived or arriving within 48 hours
        if (this.formData.goods_location === 'arrived' || 
            this.formData.goods_location === '1_2_days') {
            return false;
        }
        // Only show for goods not yet shipped
        return this.formData.goods_location === 'not_shipped_yet';
    }
    
    shouldShowDeliveryOptions() {
        // Show delivery options for all cases including not shipped yet (educational pathway)
        return this.shouldShowServiceDetails();
    }
    
    getVisibleSteps() {
        return this.steps.filter(step => !step.showIf || step.showIf());
    }
    
    // Navigation methods
    async nextStep() {
        const visibleSteps = this.getVisibleSteps();
        const currentVisibleIndex = this.getCurrentVisibleStepIndex();
        const currentStepConfig = visibleSteps[currentVisibleIndex];

        // Validate current step
        if (currentStepConfig && currentStepConfig.validation && !currentStepConfig.validation()) {
            this.scrollToFirstError();
            return;
        }

        // Save current step data
        this.saveCurrentStepData();

        // Calculate routing and scoring
        this.calculateScoring();

        // Auto-save to AirTable after each step (in-progress status)
        await this.autoSaveToAirTable();

        // Note: Auto-routing removed - always continue to document step
        // Specialist/urgent routing happens after all info is collected

        // Move to next step
        if (currentVisibleIndex < visibleSteps.length - 1) {
            // Find the next visible step in the full steps array
            const nextVisibleStep = visibleSteps[currentVisibleIndex + 1];
            const nextStepIndex = this.steps.findIndex(step => step.id === nextVisibleStep.id);
            this.currentStep = nextStepIndex + 1;
            this.renderStep();
        } else {
            this.submitForm();
        }
    }
    
    previousStep() {
        const visibleSteps = this.getVisibleSteps();
        const currentVisibleIndex = this.getCurrentVisibleStepIndex();
        
        if (currentVisibleIndex > 0) {
            // Find the previous visible step in the full steps array
            const prevVisibleStep = visibleSteps[currentVisibleIndex - 1];
            const prevStepIndex = this.steps.findIndex(step => step.id === prevVisibleStep.id);
            this.currentStep = prevStepIndex + 1;
            this.renderStep();
        }
    }
    
    shouldAutoRoute() {
        // Check for urgent routing based on new categories
        if (this.formData.goods_location === 'arrived') {
            this.formData.routing_decision = 'urgent';
            return true;
        }
        
        if (this.formData.goods_location === '1_2_days' && 
            this.formData.shipment_method === 'air_freight') {
            this.formData.routing_decision = 'urgent';
            return true;
        }
        
        // Check for specialist routing
        if (this.formData.cargo_type === 'chemicals_dangerous') {
            this.formData.routing_decision = 'specialist';
            return true;
        }
        
        // Food/beverages route to specialist but collect all documents anyway
        if (this.formData.cargo_type === 'food_beverages') {
            this.formData.routing_decision = 'specialist';
            // Don't return true - continue collecting documents
        }
        
        return false;
    }
    
    // Scoring algorithms
    calculateScoring() {
        this.calculateUrgencyScore();
        this.calculateComplexityScore();
        this.calculateReadinessScore();
        this.determineRouting();
    }
    
    calculateUrgencyScore() {
        let score = 0;
        
        // New urgency scoring based on timing categories
        switch (this.formData.goods_location) {
            case 'arrived':
                score = 10; // Priority 1 - Urgent
                break;
            case '1_2_days':
                score = 8; // Priority 2 - High
                // Extra urgency for air freight
                if (this.formData.shipment_method === 'air_freight') {
                    score = 9;
                }
                break;
            case '1_week':
                score = 5; // Priority 3 - Medium
                break;
            case 'more_than_week':
                score = 2; // Priority 4 - Low
                break;
            case 'not_shipped_yet':
                score = 1; // Lowest priority - Planning stage
                break;
        }
        
        // Cargo type urgency modifiers
        if (this.formData.cargo_type === 'food_beverages') {
            score += 2;
        }
        if (this.formData.cargo_type === 'chemicals_dangerous') {
            score += 3;
        }
        
        this.formData.urgency_score = Math.min(score, 10);
    }
    
    calculateComplexityScore() {
        let score = 0;
        
        // Cargo type complexity
        switch (this.formData.cargo_type) {
            case 'documents_samples':
                score += 0;
                break;
            case 'general_goods':
                score += 1;
                break;
            case 'personal_effects':
                score += 2;
                break;
            case 'food_beverages':
                score += 4;
                break;
            case 'frozen_goods':
                score += 5; // Requires temperature control
                break;
            case 'perishable_goods':
                score += 5; // Time-sensitive handling
                break;
            case 'vehicles_machinery':
                score += 5;
                break;
            case 'chemicals_dangerous':
                score += 8;
                break;
        }
        
        // Service complexity
        if (this.formData.shipping_payment === 'customer_pays_exw') {
            score += 4;
        } else if (this.formData.shipping_payment === 'customer_pays_fob') {
            score += 2;
        }
        
        // Value complexity
        if (this.formData.shipment_value === 'above_1000') {
            score += 2;
        }
        
        // Destination complexity (for exports)
        if (this.formData.destination_country === 'china') {
            score += 3;
        } else if (this.formData.destination_country === 'usa') {
            score += 1;
        }
        
        this.formData.complexity_score = Math.min(score, 10);
    }
    
    calculateReadinessScore() {
        let score = 0;
        
        // Contact completeness
        if (this.formData.contact_name && this.formData.email && this.formData.phone) {
            score += 3;
        }
        
        // Information completeness
        if (this.formData.direction && this.formData.customer_type && this.formData.cargo_type) {
            score += 3;
        }
        
        // Document readiness
        const docStatuses = Object.values(this.formData.document_status);
        const uploadedDocs = docStatuses.filter(status => status === 'upload').length;
        const totalDocs = docStatuses.length;
        
        if (totalDocs > 0) {
            score += Math.round((uploadedDocs / totalDocs) * 4);
        } else {
            score += 2; // Default if no documents required yet
        }
        
        this.formData.readiness_score = Math.min(score, 10);
    }
    
    determineRouting() {
        const { urgency_score, complexity_score, readiness_score } = this.formData;
        
        // Service type determination
        const isCustomsClearanceOnly = this.formData.shipping_payment === 'supplier_pays_cif';
        const isFreightForwarding = ['customer_pays_fob', 'customer_pays_exw'].includes(this.formData.shipping_payment);
        
        // FCL always requires Specialist for freight forwarding
        if (this.formData.container_type === 'fcl') {
            this.formData.routing_decision = 'specialist';
        }
        // Urgent routing (highest priority)
        else if (urgency_score >= 8) {
            this.formData.routing_decision = 'urgent';
        }
        // Specialist routing for complex cases
        else if (complexity_score >= 8) {
            this.formData.routing_decision = 'specialist';
        }
        // Customs Clearance Only pathway - simplified requirements
        else if (isCustomsClearanceOnly && urgency_score >= 4) {
            this.formData.routing_decision = 'standard';
        }
        // Freight Forwarding pathway - may need specialist for complexity
        else if (isFreightForwarding && complexity_score >= 4) {
            this.formData.routing_decision = 'specialist';
        }
        // Standard routing - general cases with readiness requirements
        else if ((urgency_score >= 4 && readiness_score >= 6) || 
                 (urgency_score >= 4 && this.formData.shipment_method === 'sea_freight')) {
            this.formData.routing_decision = 'standard';
        }
        // Education routing - needs guidance or planning
        else {
            this.formData.routing_decision = 'education';
        }
    }
    
    // Event binding methods
    bindStepEvents(step) {
        // Bind input events
        this.bindInputEvents();
        
        // Bind radio events  
        this.bindRadioEvents();
        
        // Bind file upload events
        this.bindFileUploadEvents();
        
        // Step-specific events
        switch (step.id) {
            case 'contact_info':
                this.bindContactEvents();
                break;
            case 'classification':
                this.bindClassificationEvents();
                break;
            case 'document_upload':
                this.bindDocumentEvents();
                break;
        }
    }
    
    bindInputEvents() {
        // Text inputs
        ['first_name', 'last_name', 'company_name', 'email', 'phone', 'customs_code_number', 'packing_dimensions', 'total_pallets', 'pallet_weight', 'packing_info_combined', 'cargo_details', 'other_cargo_description', 'delivery_address'].forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.formData[field] = e.target.value;
                    this.validateField(field, e.target.value);
                    
                    // Track typing activity
                    this.isUserTyping = true;
                    this.lastInputTime = Date.now();
                    
                    // Stop typing detection after delay
                    clearTimeout(this.typingTimeout);
                    this.typingTimeout = setTimeout(() => {
                        this.isUserTyping = false;
                    }, this.typingDelay);
                });
                
                input.addEventListener('focus', (e) => {
                    this.isInputFocused = true;
                });
                
                input.addEventListener('blur', (e) => {
                    this.isInputFocused = false;
                    this.validateField(field, e.target.value);
                });
            }
        });
        
        // Select inputs
        const select = document.getElementById('destination_country');
        if (select) {
            select.addEventListener('change', (e) => {
                this.formData.destination_country = e.target.value;
            });
        }
        
        // Checkbox inputs
        const mixedItemsCheckbox = document.getElementById('personal_item_mixed');
        if (mixedItemsCheckbox) {
            mixedItemsCheckbox.addEventListener('change', (e) => {
                this.formData.personal_item_mixed = e.target.checked;
            });
        }
        
        const vehicleMixedCheckbox = document.getElementById('vehicle_item_mixed');
        if (vehicleMixedCheckbox) {
            vehicleMixedCheckbox.addEventListener('change', (e) => {
                this.formData.personal_item_mixed = e.target.checked; // Same field for both
            });
        }
        
        // Add comprehensive focus tracking to all input types
        this.bindFocusTracking();
    }
    
    bindFocusTracking() {
        // Track focus state for all input elements to prevent auto-advance confusion
        const inputSelectors = 'input, textarea, select';
        
        // Use event delegation to catch all current and future inputs
        document.addEventListener('focus', (e) => {
            if (e.target.matches(inputSelectors)) {
                this.isInputFocused = true;
            }
        }, true);
        
        document.addEventListener('blur', (e) => {
            if (e.target.matches(inputSelectors)) {
                // Small delay to handle focus transitions between inputs
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (!activeElement || !activeElement.matches(inputSelectors)) {
                        this.isInputFocused = false;
                    }
                }, 50);
            }
        }, true);
        
        // Track typing in any input field
        document.addEventListener('input', (e) => {
            if (e.target.matches('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea')) {
                this.isUserTyping = true;
                this.lastInputTime = Date.now();
                
                // Stop typing detection after delay
                clearTimeout(this.typingTimeout);
                this.typingTimeout = setTimeout(() => {
                    this.isUserTyping = false;
                }, this.typingDelay);
            }
        }, true);
        
        // Track any user interaction to prevent premature auto-advance
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.lastUserInteraction = Date.now();
            }, true);
        });
    }
    
    bindRadioEvents() {
        // All radio inputs
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Handle boolean fields specially
                if (e.target.name === 'requires_temperature_control') {
                    this.formData[e.target.name] = e.target.value === 'true';
                } else {
                    this.formData[e.target.name] = e.target.value;
                }
                
                // Update visual state
                this.updateRadioSelection(e.target.name, e.target.value);
                
                // Update continue button state for step 2
                if (e.target.name === 'direction' || e.target.name === 'customer_type') {
                    this.updateContinueButton();
                }
                
                // Show container options for sea freight
                if (e.target.name === 'shipment_method') {
                    this.handleShippingMethodChange(e.target.value);
                }
                
                // Show customs code input field
                if (e.target.name === 'customs_code_status') {
                    this.handleCustomsCodeStatusChange(e.target.value);
                }
                
                // Show/hide delivery address field
                if (e.target.name === 'needs_port_delivery') {
                    this.handleDeliveryRequirementsChange(e.target.value);
                }
                
                // Re-render when cargo type changes to show/hide clarification questions
                if (e.target.name === 'cargo_type') {
                    setTimeout(() => {
                        this.renderStep();
                        // Auto-focus on sub-questions after re-render
                        this.autoFocusCargoSubQuestions();
                    }, 100);
                }
                
                // Auto-advance for certain questions (with safety checks)
                if (this.shouldAutoAdvance(e.target.name)) {
                    setTimeout(() => {
                        // Double-check that user isn't actively using inputs before advancing
                        if (!this.isUserCurrentlyActive()) {
                            this.nextStep();
                        }
                    }, 800);
                }
            });
        });
        
        // Also bind click events to radio cards for better UX
        document.querySelectorAll('.radio-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const radio = card.querySelector('input[type="radio"]');
                if (radio && !radio.checked) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    }
    
    bindFileUploadEvents() {
        document.querySelectorAll('.file-upload-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.currentTarget.dataset.doc;
                const action = e.currentTarget.dataset.action;
                
                // Update document status
                this.formData.document_status[docId] = action;
                
                // Update UI
                this.updateDocumentStatus(docId, action);
                
                if (action === 'upload') {
                    this.openFileUpload(docId);
                }
            });
        });
        
        // File remove buttons
        document.querySelectorAll('.uploaded-file-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.currentTarget.dataset.doc;
                const fileName = e.currentTarget.dataset.file;
                this.removeFile(docId, fileName);
            });
        });
    }
    
    bindContactEvents() {
        // Real-time email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                this.validateEmailRealTime(e.target.value);
            });
        }
        
        // Phone formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
        
        // Consent checkbox
        const consentCheckbox = document.getElementById('consent_checkbox');
        if (consentCheckbox) {
            consentCheckbox.addEventListener('change', (e) => {
                this.formData.consent_checkbox = e.target.checked;
            });
        }
    }
    
    bindClassificationEvents() {
        // Auto-calculation when classification changes
        document.querySelectorAll('input[name="direction"], input[name="customer_type"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.calculateScoring();
                
                // Show/hide company name field
                if (radio.name === 'customer_type') {
                    this.toggleCompanyNameField(radio.value);
                }
            });
        });
        
        // Company name input
        const companyInput = document.getElementById('company_name');
        if (companyInput) {
            companyInput.addEventListener('input', (e) => {
                this.formData.company_name = e.target.value;
                this.updateContinueButton();
            });
        }
    }
    
    toggleCompanyNameField(customerType) {
        const companySection = document.getElementById('company_name_section');
        if (companySection) {
            if (customerType === 'business') {
                companySection.classList.remove('hide');
                companySection.classList.add('show');
            } else {
                companySection.classList.remove('show');
                companySection.classList.add('hide');
                // Clear company name if switching to personal
                this.formData.company_name = '';
                const companyInput = document.getElementById('company_name');
                if (companyInput) {
                    companyInput.value = '';
                }
            }
        }
    }
    
    handleShippingMethodChange(method) {
        // Clear container type when switching away from sea freight
        if (method !== 'sea_freight' && this.formData.container_type) {
            this.formData.container_type = '';
        }
        
        // Re-render the step to show/hide container options
        setTimeout(() => {
            this.renderStep();
        }, 100);
    }
    
    handleCustomsCodeStatusChange(status) {
        // Re-render to show/hide customs code input
        setTimeout(() => {
            this.renderStep();
        }, 100);
    }
    
    handleDeliveryRequirementsChange(value) {
        // Re-render to show/hide delivery address field
        setTimeout(() => {
            this.renderStep();
        }, 100);
    }
    
    bindDocumentEvents() {
        // Customs code status change
        document.querySelectorAll('input[name="customs_code_status"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.formData.customs_code_status = e.target.value;
                this.handleCustomsCodeStatusChange(e.target.value);
            });
        });
        
        // Customs code number input
        const customsCodeInput = document.getElementById('customs_code_number');
        if (customsCodeInput) {
            customsCodeInput.addEventListener('input', (e) => {
                this.formData.customs_code_number = e.target.value;
            });
        }
    }
    
    // UI Helper methods
    updateRadioSelection(name, value) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            const card = radio.closest('.radio-card');
            if (card) {
                if (radio.value === value) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            }
        });
    }
    
    updateDocumentStatus(docId, action) {
        // Update button states
        document.querySelectorAll(`[data-doc="${docId}"]`).forEach(btn => {
            if (btn.dataset.action === action) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        // Show/hide file upload area
        const fileArea = document.getElementById(`files_${docId}`);
        if (fileArea) {
            if (action === 'upload') {
                fileArea.style.display = 'block';
            } else {
                fileArea.style.display = 'none';
            }
        }
        
        // Special handling for packing list - re-render the section to show/hide text inputs
        if (docId === 'packing_list') {
            this.renderStep();
            // Re-bind events after re-render
            this.bindEvents();
        }
        
        // Auto-focus next question in document step
        this.autoFocusNextDocument();
    }
    
    autoFocusNextDocument() {
        // Only apply on document upload step
        const visibleSteps = this.getVisibleSteps();
        const currentVisibleIndex = this.getCurrentVisibleStepIndex();
        const currentStepConfig = visibleSteps[currentVisibleIndex];
        if (!currentStepConfig || currentStepConfig.id !== 'document_upload') {
            return;
        }
        
        const documents = this.getRequiredDocuments();
        
        // Find first unanswered document
        for (const doc of documents) {
            if (!this.formData.document_status[doc.id]) {
                // Scroll to this document section
                const docElement = document.querySelector(`[data-doc="${doc.id}"]`);
                if (docElement) {
                    const uploadItem = docElement.closest('.file-upload-item');
                    if (uploadItem) {
                        uploadItem.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        // Add a subtle highlight effect
                        uploadItem.style.background = '#fff3cd';
                        setTimeout(() => {
                            uploadItem.style.background = '';
                        }, 2000);
                        break;
                    }
                }
            }
        }
    }
    
    autoFocusCargoSubQuestions() {
        // Focus on cargo type clarification fields when cargo type is selected
        const currentStepConfig = this.getVisibleSteps()[this.getCurrentVisibleStepIndex()];
        if (!currentStepConfig || currentStepConfig.id !== 'cargo_type') {
            return;
        }
        
        // Delay to allow DOM to update after cargo type selection
        setTimeout(() => {
            let focusElement = null;
            
            // Determine which field to focus based on cargo type
            switch(this.formData.cargo_type) {
                case 'general_goods':
                    focusElement = document.getElementById('cargo_details');
                    break;
                case 'personal_effects':
                case 'vehicles_machinery':
                    // Focus on first radio button if not already selected
                    if (!this.formData.personal_item_condition) {
                        focusElement = document.querySelector('input[name="personal_item_condition"]');
                    }
                    break;
                case 'food_beverages':
                    // Focus on temperature control if not already selected
                    if (this.formData.requires_temperature_control === undefined || this.formData.requires_temperature_control === null) {
                        focusElement = document.querySelector('input[name="requires_temperature_control"]');
                    }
                    break;
                case 'other':
                    focusElement = document.getElementById('other_cargo_description');
                    break;
            }
            
            if (focusElement) {
                // Scroll to the clarification section
                const questionContainer = focusElement.closest('.question');
                if (questionContainer) {
                    questionContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // Add temporary highlight
                    questionContainer.style.background = '#fff3cd';
                    setTimeout(() => {
                        questionContainer.style.background = '#f8f9fa';
                    }, 2000);
                    
                    // Focus the input field
                    setTimeout(() => {
                        focusElement.focus();
                    }, 300);
                }
            }
        }, 100);
    }
    
    shouldAutoAdvance(fieldName) {
        // Prevent auto-advance if user is currently focused on any input field
        if (this.isInputFocused) {
            return false;
        }
        
        // Prevent auto-advance if user was recently typing
        if (this.isUserTyping || (Date.now() - this.lastInputTime) < this.typingDelay) {
            return false;
        }
        
        // Remove auto-advance from first 2 screens (classification)
        if (fieldName === 'direction' || fieldName === 'customer_type') {
            return false;
        }
        
        // Remove auto-advance from step 3 (goods_location)
        if (fieldName === 'goods_location') {
            return false;
        }
        
        // Auto-advance for other single-answer questions (none currently)
        const autoAdvanceFields = [
            // No auto-advance fields currently
        ];
        
        return autoAdvanceFields.includes(fieldName);
    }
    
    isUserCurrentlyActive() {
        // Check if user is actively interacting with form inputs
        return this.isInputFocused || 
               this.isUserTyping || 
               (Date.now() - this.lastInputTime) < this.typingDelay ||
               (Date.now() - this.lastUserInteraction) < this.interactionDelay;
    }
    
    // Validation UI methods
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}_error`);
        
        if (field) {
            field.classList.add('error');
            field.classList.remove('success');
        }
        
        if (errorEl) {
            errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            errorEl.style.display = 'flex';
        }
    }
    
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(`${fieldId}_error`);
        
        if (field) {
            field.classList.remove('error');
            field.classList.add('success');
        }
        
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    
    validateField(fieldId, value) {
        switch (fieldId) {
            case 'contact_name':
                if (value.trim().length >= 2) {
                    this.clearFieldError(fieldId);
                    return true;
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(value)) {
                    this.clearFieldError(fieldId);
                    return true;
                }
                break;
            case 'phone':
                if (value.length >= 8) {
                    this.clearFieldError(fieldId);
                    return true;
                }
                break;
        }
        return false;
    }
    
    validateEmailRealTime(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailField = document.getElementById('email');
        
        if (email.length === 0) {
            emailField.classList.remove('error', 'success');
            return;
        }
        
        if (emailRegex.test(email)) {
            emailField.classList.remove('error');
            emailField.classList.add('success');
        } else {
            emailField.classList.remove('success');
            emailField.classList.add('error');
        }
    }
    
    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('64')) {
            // New Zealand format
            value = value.replace(/^64/, '+64 ');
            if (value.length > 6) {
                value = value.slice(0, 6) + ' ' + value.slice(6);
            }
        } else if (value.startsWith('0')) {
            // Local format
            value = value.replace(/^0/, '0');
            if (value.length > 3) {
                value = value.slice(0, 3) + ' ' + value.slice(3);
            }
            if (value.length > 7) {
                value = value.slice(0, 7) + ' ' + value.slice(7);
            }
        }
        
        input.value = value;
    }
    
    // Progress and navigation updates
    updateProgress() {
        const visibleSteps = this.getVisibleSteps();
        
        // Find current visible step index
        const currentVisibleStepIndex = this.getCurrentVisibleStepIndex();
        
        // Progress bar shows completion status
        const isOnReviewStep = visibleSteps[currentVisibleStepIndex]?.id === 'review';
        const isLastStep = currentVisibleStepIndex === visibleSteps.length - 1;
        
        let progress;
        if (isLastStep) {
            progress = 100; // Fill completely on last step
        } else {
            progress = ((currentVisibleStepIndex + 1) / visibleSteps.length) * 90; // Cap at 90% until last step
        }
        
        this.progressFill.style.width = `${progress}%`;
        this.currentStepEl.textContent = `Step ${currentVisibleStepIndex + 1}`;
        this.totalStepsEl.textContent = visibleSteps.length;
        
        // Time estimate - hide on last step
        if (isLastStep) {
            this.timeEstimate.textContent = 'Ready to submit';
        } else {
            const remainingSteps = visibleSteps.length - (currentVisibleStepIndex + 1);
            const estimatedMinutes = Math.max(1, remainingSteps * 0.75);
            this.timeEstimate.textContent = `~${Math.ceil(estimatedMinutes)} min remaining`;
        }
    }
    
    getCurrentVisibleStepIndex() {
        const visibleSteps = this.getVisibleSteps();
        
        // Safety check: ensure currentStep is valid
        if (this.currentStep < 1 || this.currentStep > this.steps.length) {
            return 0;
        }
        
        const currentStepId = this.steps[this.currentStep - 1].id;
        const index = visibleSteps.findIndex(step => step.id === currentStepId);
        
        // Fallback: if current step not found in visible steps, return 0
        // This can happen during step transitions or conditional visibility changes
        return index >= 0 ? index : 0;
    }
    
    updateNavigation() {
        const visibleSteps = this.getVisibleSteps();
        const currentVisibleIndex = this.getCurrentVisibleStepIndex();
        
        // Previous button
        if (currentVisibleIndex > 0) {
            this.prevBtn.style.display = 'flex';
        } else {
            this.prevBtn.style.display = 'none';
        }
        
        // Next/Submit button  
        if (currentVisibleIndex < visibleSteps.length - 1) {
            this.nextBtn.style.display = 'flex';
            this.submitBtn.style.display = 'none';
        } else {
            this.nextBtn.style.display = 'none';
            this.submitBtn.style.display = 'flex';
        }
        
        // Update continue button state
        this.updateContinueButton();
    }
    
    updateContinueButton() {
        const visibleSteps = this.getVisibleSteps();
        const currentStepConfig = visibleSteps[this.currentStep - 1];
        
        if (currentStepConfig?.id === 'classification') {
            // For step 2, disable continue until required fields are selected
            const bothSelected = this.formData.direction && this.formData.customer_type;
            const companyNameValid = this.formData.customer_type !== 'business' || 
                                   (this.formData.customer_type === 'business' && this.formData.company_name.trim());
            
            const canContinue = bothSelected && companyNameValid;
            this.nextBtn.disabled = !canContinue;
            
            if (canContinue) {
                this.nextBtn.innerHTML = `
                    Continue
                    <i class="fas fa-arrow-right"></i>
                `;
            } else if (!bothSelected) {
                this.nextBtn.innerHTML = `
                    Please select both options above
                    <i class="fas fa-arrow-right"></i>
                `;
            } else {
                this.nextBtn.innerHTML = `
                    Please complete company name
                    <i class="fas fa-arrow-right"></i>
                `;
            }
        } else {
            // For other steps, enable continue button
            this.nextBtn.disabled = false;
            this.nextBtn.innerHTML = `
                Continue
                <i class="fas fa-arrow-right"></i>
            `;
        }
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    scrollToFirstError() {
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            firstError.focus();
        }
    }
    
    focusFirstInput() {
        setTimeout(() => {
            const firstInput = document.querySelector('.form-input, input[type="radio"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
    
    // Data persistence
    saveCurrentStepData() {
        // Data is already being saved in real-time through event handlers
    }
    
    saveData() {
        try {
            localStorage.setItem('easyFreightFormData', JSON.stringify({
                ...this.formData,
                currentStep: this.currentStep,
                timestamp: Date.now()
            }));
            this.showAutoSave();
        } catch (e) {
            console.warn('Could not save form data to localStorage:', e);
        }
    }
    
    loadSavedData() {
        try {
            const saved = localStorage.getItem('easyFreightFormData');
            if (saved) {
                const data = JSON.parse(saved);
                const age = Date.now() - (data.timestamp || 0);
                
                // Load if less than 24 hours old
                if (age < 24 * 60 * 60 * 1000) {
                    this.formData = { ...this.formData, ...data };
                    this.currentStep = data.currentStep || 1;
                }
            }
        } catch (e) {
            console.warn('Could not load saved form data:', e);
        }
    }
    
    // Auto-save functionality removed
    
    hasUnsavedChanges() {
        // Simple check - in a real app this would be more sophisticated
        return this.currentStep > 1;
    }
    
    // File upload methods
    openFileUpload(docId) {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        input.multiple = false;
        
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (this.validateFile(file)) {
                    this.addFile(docId, file);
                }
            });
        });
        
        input.click();
    }
    
    validateFile(file) {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        
        if (file.size > maxSize) {
            alert('File size must be less than 20MB');
            return false;
        }
        
        if (!allowedTypes.includes(file.type)) {
            alert('Only PDF, JPG, and PNG files are allowed');
            return false;
        }
        
        return true;
    }
    
    addFile(docId, file) {
        if (!this.formData.documents[docId]) {
            this.formData.documents[docId] = [];
        }
        
        // Add file (in real app, this would upload to server)
        const fileObj = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        };
        
        this.formData.documents[docId].push(fileObj);
        
        // Update UI
        const filesContainer = document.getElementById(`files_${docId}`);
        if (filesContainer) {
            filesContainer.innerHTML = this.renderUploadedFiles(docId);
            this.bindFileUploadEvents(); // Re-bind events for new elements
        }
        
        // Update readiness score
        this.calculateReadinessScore();
    }
    
    removeFile(docId, fileName) {
        if (this.formData.documents[docId]) {
            this.formData.documents[docId] = this.formData.documents[docId].filter(
                file => file.name !== fileName
            );
            
            // Update UI
            const filesContainer = document.getElementById(`files_${docId}`);
            if (filesContainer) {
                filesContainer.innerHTML = this.renderUploadedFiles(docId);
                this.bindFileUploadEvents();
            }
            
            // Update readiness score
            this.calculateReadinessScore();
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Results and submission
    generateSummary() {
        const summary = [];
        
        // Contact Information
        const fullName = `${this.formData.first_name} ${this.formData.last_name}`.trim();
        summary.push({ label: 'Name', value: fullName });
        if (this.formData.company_name) {
            summary.push({ label: 'Company', value: this.formData.company_name });
        }
        summary.push({ label: 'Email', value: this.formData.email });
        summary.push({ label: 'Phone', value: this.formData.phone });
        summary.push({ label: 'Service Type', value: this.formData.direction === 'import' ? 'Import to NZ' : 'Export from NZ' });
        summary.push({ label: 'Customer Type', value: this.formData.customer_type === 'business' ? 'Business' : 'Personal' });
        
        // Goods Location/Timing
        if (this.formData.goods_location) {
            const locationLabels = {
                'arrived': 'Already arrived in NZ (URGENT)',
                '1_2_days': 'Arriving within 48 hours',
                '1_week': 'Arriving within one week',
                'more_than_week': 'Arriving in more than one week',
                'not_shipped_yet': 'Not shipped yet'
            };
            summary.push({ label: 'Goods Location', value: locationLabels[this.formData.goods_location] });
        }
        
        // Shipping Method & Payment Terms
        if (this.formData.shipment_method) {
            const methodLabels = {
                'sea_freight': 'Sea Freight',
                'air_freight': 'Air Freight',
                'courier': 'Courier'
            };
            summary.push({ label: 'Shipping Method', value: methodLabels[this.formData.shipment_method] });
        }
        
        if (this.formData.container_type) {
            const containerLabels = {
                'lcl': 'LCL (Less than Container Load)',
                'fcl': 'FCL (Full Container Load)'
            };
            summary.push({ label: 'Container Type', value: containerLabels[this.formData.container_type] });
        }
        
        if (this.formData.air_weight_category) {
            const weightLabels = {
                'under_100kg': 'Under 100kg',
                'over_100kg': 'Over 100kg'
            };
            summary.push({ label: 'Air Freight Weight', value: weightLabels[this.formData.air_weight_category] });
        }
        
        if (this.formData.shipping_payment) {
            const paymentLabels = {
                'supplier_pays_cif': 'Supplier pays shipping (CIF)',
                'customer_pays_fob': 'Customer pays shipping (FOB)',
                'customer_pays_exw': 'Customer pays all (EXW)'
            };
            summary.push({ label: 'Payment Terms', value: paymentLabels[this.formData.shipping_payment] });
        }
        
        if (this.formData.local_delivery) {
            summary.push({ label: 'Local Delivery', value: this.formData.local_delivery === 'yes' ? 'Required' : 'Not required' });
        }
        
        // Export Destination
        if (this.formData.destination_country) {
            summary.push({ label: 'Destination Country', value: this.formData.destination_country });
        }
        
        if (this.formData.export_service_needed) {
            const serviceLabels = {
                'shipping_and_clearance': 'Shipping + Export Clearance',
                'clearance_only': 'Export Clearance Only',
                'not_sure': 'Not Sure'
            };
            summary.push({ label: 'Export Service', value: serviceLabels[this.formData.export_service_needed] });
        }
        
        // Delivery Address (if provided and delivery is required)
        if (this.formData.needs_port_delivery === 'yes' && this.formData.delivery_address && this.formData.delivery_address.trim()) {
            const isExport = this.formData.direction === 'export';
            const label = isExport ? 'Collection Address' : 'Delivery Address';
            summary.push({ label: label, value: this.formData.delivery_address.trim() });
        }
        
        // Cargo Details
        if (this.formData.cargo_type) {
            const cargoLabels = {
                'general_goods': 'General goods',
                'food_beverages': 'Food & beverages',
                'frozen_goods': 'Frozen goods',
                'perishable_goods': 'Perishable goods',
                'personal_effects': 'Personal effects',
                'vehicles_machinery': 'Vehicles/machinery',
                'chemicals_dangerous': 'Chemicals/dangerous goods',
                'documents_samples': 'Documents/samples'
            };
            summary.push({ label: 'Cargo Type', value: cargoLabels[this.formData.cargo_type] });
        }
        
        if (this.formData.personal_item_condition) {
            summary.push({ label: 'Item Condition', value: this.formData.personal_item_condition === 'used' ? 'Used' : 'New' });
        }
        
        if (this.formData.cargo_type === 'food_beverages') {
            summary.push({ label: 'BIO Security', value: 'Required' });
        }
        
        // Note: Packing Information moved to separate section below
        
        // Customs Code - show number if provided, otherwise show status
        if (this.formData.customs_code_number && this.formData.customs_code_status === 'have_code') {
            summary.push({ label: 'Customs Code Number', value: this.formData.customs_code_number });
        } else if (this.formData.customs_code_status === 'need_help') {
            summary.push({ label: 'Customs Code', value: 'Need help getting a Customs Client Code' });
        }
        
        // Note: Document status moved to separate section below
        
        return summary;
    }
    
    generateDocumentSummary() {
        const documents = this.getRequiredDocuments();
        const documentSummary = [];
        
        documents.forEach(doc => {
            const status = this.formData.document_status[doc.id];
            if (status) {
                const statusLabels = {
                    'upload': '✅ Uploaded',
                    'dont_have': '⏳ Don\'t have yet', 
                    'need_help': '❓ Need help creating'
                };
                
                let docTitle = doc.title;
                // Clean up title formatting
                docTitle = docTitle.replace(/^[📄📋✈️🚢📦⚠️]\s*/, ''); // Remove emoji prefixes
                
                documentSummary.push({
                    title: docTitle,
                    status: statusLabels[status] || status
                });
            }
        });
        
        return documentSummary;
    }
    
    generatePackingInfoSummary() {
        if (this.formData.packing_info_combined && this.formData.packing_info_combined.trim()) {
            return this.formData.packing_info_combined.trim();
        }
        return null;
    }
    
    getRoutingDisplayName() {
        const routingNames = {
            'urgent': '🚨 URGENT PRIORITY',
            'standard': '⭐ STANDARD PROCESSING', 
            'education': '📚 EDUCATION PATHWAY',
            'specialist': '🔬 SPECIALIST REQUIRED'
        };
        return routingNames[this.formData.routing_decision] || 'STANDARD PROCESSING';
    }
    
    getRoutingDescription() {
        const descriptions = {
            'urgent': 'We\'ll contact you within 30 minutes to expedite your clearance',
            'standard': 'You\'ll receive your detailed quote within 4 hours',
            'education': 'We\'ve sent educational resources and will follow up in 3-5 days',
            'specialist': 'A specialist will review your requirements and contact you within 2 hours'
        };
        return descriptions[this.formData.routing_decision] || 'Standard processing timeline applies';
    }
    
    async submitForm() {
        this.showLoadingScreen();

        try {
            // Simulate processing animation
            await this.simulateProcessing();

            // Submit to AirTable
            const submissionResult = await this.submitToAirTable();

            if (submissionResult.success) {
                // Store the AirTable record ID
                this.formData.airtable_record_id = submissionResult.recordId;

                // Show results
                this.hideLoadingScreen();
                this.showResults();
                this.clearSavedData();
            } else {
                throw new Error(submissionResult.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.hideLoadingScreen();
            this.showSubmissionError(error.message);
        }
    }
    
    simulateProcessing() {
        return new Promise(resolve => {
            const steps = [
                { id: 'step1', delay: 800, text: 'Validating information...' },
                { id: 'step2', delay: 1200, text: 'Calculating complexity score...' },
                { id: 'step3', delay: 1000, text: 'Routing to appropriate specialist...' },
                { id: 'step4', delay: 1500, text: 'Preparing your personalised response...' }
            ];
            
            let currentStep = 0;
            
            const processStep = () => {
                if (currentStep < steps.length) {
                    const step = steps[currentStep];
                    
                    // Update loading message
                    document.getElementById('loadingMessage').textContent = step.text;
                    
                    // Mark step as active
                    document.getElementById(step.id).classList.add('active');
                    
                    setTimeout(() => {
                        // Mark step as completed
                        document.getElementById(step.id).classList.remove('active');
                        document.getElementById(step.id).classList.add('completed');
                        
                        currentStep++;
                        processStep();
                    }, step.delay);
                } else {
                    resolve();
                }
            };
            
            processStep();
        });
    }
    
    showLoadingScreen() {
        this.loadingOverlay.style.display = 'flex';
        
        // Reset loading steps
        document.querySelectorAll('.loading-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
    }
    
    hideLoadingScreen() {
        this.loadingOverlay.style.display = 'none';
    }
    
    showResults() {
        // Hide form
        document.querySelector('.form-container').style.display = 'none';
        
        // Show results
        this.resultsContainer.style.display = 'block';
        
        // Generate results content
        const resultsHeader = document.getElementById('resultsHeader');
        const resultsBody = document.getElementById('resultsBody');
        
        const routing = this.formData.routing_decision;
        const routingConfig = this.getRoutingConfig(routing);
        
        resultsHeader.className = `results-header ${routing}`;
        resultsHeader.innerHTML = `
            <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${routingConfig.title}</h3>
            <p style="font-size: 0.75rem; margin: 0; opacity: 0.9;">${routingConfig.subtitle}</p>
        `;
        
        resultsBody.innerHTML = `
            <div style="display: grid; gap: 1.25rem; margin-top: 1.25rem;">
                ${this.shouldShowPricing() ? this.generatePricingEstimate() : this.generateSpecialistAdvice()}
                ${this.generateResetButton()}
            </div>
        `;
        
        // Bind reset button
        const resetBtn = document.getElementById('resetFormBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
        
        // Bind print button
        const printBtn = document.getElementById('printQuoteBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printQuote();
            });
        }
        
        // Bind download button
        const downloadBtn = document.getElementById('downloadSubmissionBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadSubmission();
            });
        }
        
        // Scroll to top
        this.scrollToTop();
    }
    
    resetForm() {
        // Reset form data
        this.formData = {
            // Contact Information (Step 1)
            first_name: '',
            last_name: '',
            company_name: '',
            email: '',
            phone: '',
            consent_checkbox: false,
            
            // Classification (Step 2)
            direction: '', // import/export
            customer_type: '', // business/personal
            
            // Import-specific questions
            goods_location: '', // Only for imports
            arrival_method: '',
            arrival_timeline: '',
            
            // Service classification
            shipping_payment: '',
            local_delivery: '',
            shipment_method: '',
            container_type: '',
            air_weight_category: '',
            
            // Export-specific
            export_service_needed: '',
            destination_country: '',
            
            // Cargo details
            cargo_type: '',
            cargo_details: '', // free text field for general goods and other
            personal_item_condition: '', // used or new for personal items (can be both)
            personal_item_mixed: false, // checkbox for mixed new/used personal items
            other_cargo_description: '', // free text for Other option
            requires_temperature_control: false, // for food/beverages and hazardous
            needs_port_delivery: '', // yes/no for delivery from port/airport
            delivery_address: '', // optional address for local delivery/collection
            
            // Packing information (when packing list not available)
            packing_dimensions: '', // dimensions per pallet
            total_pallets: '', // total number of pallets
            pallet_weight: '', // weight per pallet and total
            packing_info_combined: '', // combined packing information field
            
            // Customs code
            customs_code_status: '',
            customs_code_number: '',
            
            // Document uploads
            documents: {},
            document_status: {},
            
            // Scoring
            urgency_score: 0,
            complexity_score: 0,
            readiness_score: 0,
            routing_decision: ''
        };
        
        // Reset to step 1
        this.currentStep = 1;
        
        // Hide results and show form
        this.resultsContainer.style.display = 'none';
        document.querySelector('.form-container').style.display = 'flex';
        
        // Render first step
        this.renderStep();
    }
    
    getRoutingConfig(routing) {
        // Determine service type for enhanced messaging
        const isCustomsClearanceOnly = this.formData.shipping_payment === 'supplier_pays_cif';
        const isFreightForwarding = ['customer_pays_fob', 'customer_pays_exw'].includes(this.formData.shipping_payment);
        
        const configs = {
            urgent: {
                title: '🚨 URGENT PRIORITY',
                subtitle: 'High Priority Processing',
                description: 'Your shipment requires immediate attention.'
            },
            standard: {
                title: isCustomsClearanceOnly ? '⭐ CUSTOMS CLEARANCE' : '⭐ STANDARD PROCESSING', 
                subtitle: isCustomsClearanceOnly ? 'Customs Clearance Service' : 'Standard Processing Queue',
                description: isCustomsClearanceOnly ? 
                    'Your goods will be cleared through customs using our standard process.' :
                    'Your request will be processed using our standard timeline.'
            },
            education: {
                title: '📚 PLANNING ASSISTANCE',
                subtitle: 'Consultation & Guidance',
                description: 'We\'ll provide helpful resources and guidance for your shipping needs.'
            },
            specialist: {
                title: isFreightForwarding ? '🚢 FREIGHT FORWARDING' : '🔬 SPECIALIST REQUIRED',
                subtitle: isFreightForwarding ? 'Full Logistics Service' : 'Specialist Review Needed',
                description: isFreightForwarding ? 
                    'Your shipment requires comprehensive freight forwarding and logistics coordination.' :
                    'Your cargo requires specialist knowledge and expertise.'
            }
        };
        
        return configs[routing] || configs.standard;
    }
    
    shouldShowPricing() {
        // Show pricing for standard customs clearance cases and urgent cases
        const isCustomsClearanceOnly = this.formData.shipping_payment === 'supplier_pays_cif';
        const isFreightForwarding = ['customer_pays_fob', 'customer_pays_exw'].includes(this.formData.shipping_payment);
        const isFCL = this.formData.container_type === 'fcl';
        const isSpecialistRoute = this.formData.routing_decision === 'specialist';
        const isUrgentRoute = this.formData.routing_decision === 'urgent';
        const isStandardRoute = this.formData.routing_decision === 'standard';
        
        // Show pricing for:
        // 1. Customs clearance only cases (not specialist, not FCL)
        // 2. Urgent cases (even if freight forwarding, as long as not specialist)
        // 3. Standard route cases
        if (isSpecialistRoute || isFCL) {
            return false;
        }
        
        return isCustomsClearanceOnly || isUrgentRoute || isStandardRoute;
    }
    
    generateReferenceId() {
        // Generate reference ID in format: EF-[YYYYMMDDHHmmss]
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `EF-${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    
    getFieldDisplayValue(field, value) {
        // Convert raw field values to user-friendly display labels
        const displayMappings = {
            shipment_method: {
                'sea_freight': 'Sea Freight',
                'air_freight': 'Air Freight',
                'courier': 'Courier/Express',
                'not_sure': 'Not Sure'
            },
            container_type: {
                'fcl': 'FCL (Full Container Load)',
                'lcl': 'LCL (Less than Container Load)'
            },
            direction: {
                'import': 'To New Zealand',
                'export': 'From New Zealand'
            },
            customer_type: {
                'business': 'Business',
                'personal': 'Personal'
            },
            goods_location: {
                'port': 'Sea freight (Port)',
                'airport': 'Air freight',
                'courier': 'Courier/Express',
                'other': 'Other location'
            },
            shipping_payment: {
                'supplier_pays_cif': 'Supplier arranges and pays (CIF/DDU)',
                'customer_pays_fob': 'I arrange shipping to New Zealand from origin port',
                'customer_pays_exw': 'I collect goods from supplier warehouse'
            },
            air_weight_category: {
                'under_100kg': 'Under 100kg',
                'over_100kg': 'Over 100kg'
            },
            cargo_type: {
                'general_goods': 'General goods',
                'food_beverages': 'Food & beverages',
                'personal_effects': 'Personal effects',
                'vehicles_machinery': 'Vehicles/machinery',
                'hazardous': 'Hazardous',
                'other': 'Other'
            },
            needs_port_delivery: {
                'yes': 'Yes',
                'no': 'No'
            },
            customs_code_status: {
                'have_code': 'I have a Customs Client Code',
                'need_help': 'I need help getting one',
                'apply_myself': "I'll apply myself"
            }
        };
        
        if (displayMappings[field] && displayMappings[field][value]) {
            return displayMappings[field][value];
        }
        
        // Return the original value if no mapping exists
        return value;
    }
    
    generateSpecialistAdvice() {
        const isFreightForwarding = ['customer_pays_fob', 'customer_pays_exw'].includes(this.formData.shipping_payment);
        const isFCL = this.formData.container_type === 'fcl';
        
        let serviceType = 'specialist consultation';
        if (isFreightForwarding || isFCL) {
            serviceType = 'freight forwarding service';
        }
        
        return `
            <div style="background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white; border-radius: 0.5rem; padding: 1rem; text-align: center;">
                <h3 style="margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.9rem;">
                    <i class="fas fa-envelope"></i>
                    Specialist Review Required
                </h3>
                
                <div style="background: rgba(255,255,255,0.1); border-radius: 0.4rem; padding: 1rem; margin-bottom: 0.75rem;">
                    <p style="margin-bottom: 0.75rem; font-size: 0.85rem; line-height: 1.4;">
                        Your ${serviceType} requires detailed review by our specialist team.
                    </p>
                    
                    <div style="background: rgba(255,255,255,0.1); border-radius: 0.3rem; padding: 0.75rem; margin-bottom: 0.75rem;">
                        <h4 style="margin-bottom: 0.5rem; font-size: 0.8rem;">What happens next:</h4>
                        <ul style="margin: 0; padding-left: 1rem; font-size: 0.75rem; line-height: 1.4;">
                            <li style="margin-bottom: 0.3rem;">Our specialist will review your requirements within 2 business hours</li>
                            <li style="margin-bottom: 0.3rem;">You'll receive a detailed quote or request for clarifications via email</li>
                            <li style="margin-bottom: 0.3rem;">We may contact you to discuss complex requirements</li>
                            <li>All pricing will be confirmed before any work begins</li>
                        </ul>
                    </div>
                    

                </div>
            </div>
        `;
    }
    
    generatePricingEstimate() {
        const pricing = this.calculatePricingEstimate();
        
        return `
            <div style="background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white; border-radius: 0.5rem; padding: 1rem; text-align: left; font-size: 0.8rem;">
                <h3 style="margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                    <i class="fas fa-calculator"></i>
                    Your Estimated Quote
                </h3>
                
                <div style="background: rgba(255,255,255,0.1); border-radius: 0.4rem; padding: 0.75rem; margin-bottom: 0.75rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #fff; font-size: 0.8rem;">Easy Freight Service Fees</h4>
                    <div style="display: grid; gap: 0.4rem; font-size: 0.75rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Customs Clearance (Base)*</span>
                            <strong>NZD $197.00</strong>
                        </div>
                        ${pricing.customsCodeFee > 0 ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>Customs Client Code Application</span>
                            <strong>NZD $95.00</strong>
                        </div>
                        ` : ''}
                        ${pricing.specialHandlingFee > 0 ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>BIO Security</span>
                            <strong>NZD $67.00</strong>
                        </div>
                        ` : ''}
                        <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 0.4rem 0;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                            <strong>Service Total (excl. GST)</strong>
                            <strong>NZD $${pricing.serviceTotal.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>GST (15%)</span>
                            <strong>NZD $${pricing.gstOnServices.toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 0.4rem;">
                            <strong>Total Service Fee</strong>
                            <strong>NZD $${pricing.totalServiceFee.toFixed(2)}</strong>
                        </div>
                        <p style="margin-top: 0.5rem; font-size: 0.65rem; opacity: 0.9;">
                            *Our rate includes the classification of 5 invoice lines. Each additional line costs NZD 5 + GST per line.
                        </p>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); border-radius: 0.4rem; padding: 0.75rem; margin-bottom: 0.75rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #fff; font-size: 0.8rem;">Government Fees (Payable at Clearance)</h4>
                    <div style="display: grid; gap: 0.3rem; font-size: 0.7rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Customs Transaction Fee (CTF)</span>
                            <span>NZD $106.80</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Import Duty</span>
                            <span>Variable*</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>GST on Goods (15%)</span>
                            <span>Variable*</span>
                        </div>
                        ${this.formData.cargo_type === 'food_beverages' ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span>MPI Biosecurity Fees</span>
                            <span>Variable*</span>
                        </div>
                        ` : ''}
                    </div>
                    <p style="margin-top: 0.5rem; font-size: 0.65rem; opacity: 0.8;">
                        *Government fees depend on goods classification, origin country, and declared value
                    </p>
                </div>
                
                ${this.formData.needs_port_delivery === 'yes' ? `
                <div style="background: rgba(255,255,255,0.1); border-radius: 0.4rem; padding: 0.75rem; margin-bottom: 0.75rem;">
                    <h4 style="margin-bottom: 0.5rem; color: #fff; font-size: 0.8rem;">Local Delivery Service</h4>
                    <div style="display: grid; gap: 0.3rem; font-size: 0.7rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Local Delivery</span>
                            <span>Variable*</span>
                        </div>
                    </div>
                    <p style="margin-top: 0.5rem; font-size: 0.65rem; opacity: 0.8;">
                        *Price for Local delivery is Variable - our Local delivery specialist will contact you for details
                    </p>
                </div>
                ` : ''}
                
                <div style="padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 0.4rem; font-size: 0.7rem;">
                    <strong>Payment Terms:</strong> Easy Freight service fee payable before work begins. Government fees collected separately when known.
                    <br><br>
                    Additional information is in <a href="https://easyfreight.co.nz/wp-content/themes/easyfreight/terms/terms_conditions.pdf" target="_blank" style="color: #fff; text-decoration: underline;">Terms & Conditions</a>
                </div>
            </div>
        `;
    }
    
    calculatePricingEstimate() {
        let serviceTotal = 197; // Base clearance fee
        let customsCodeFee = 0;
        let extraLines = 0;
        let specialHandlingFee = 0;
        
        // Customs Code application fee
        if (this.formData.customs_code_status === 'need_help') {
            customsCodeFee = 95;
            serviceTotal += customsCodeFee;
        }
        
        // BIO Security fee (required for all food/beverages cargo)
        if (this.formData.cargo_type === 'food_beverages') {
            specialHandlingFee = 67;
            serviceTotal += specialHandlingFee;
        }
        
        // Note: Extra invoice lines logic removed - now handled with asterisk and note
        
        const gstOnServices = serviceTotal * 0.15;
        const totalServiceFee = serviceTotal + gstOnServices;
        
        return {
            serviceTotal,
            customsCodeFee,
            specialHandlingFee,
            gstOnServices,
            totalServiceFee
        };
    }
    
    generateScoreDisplay() {
        return `
            <div style="background: #f8f9fa; border-radius: 0.75rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                    <i class="fas fa-chart-bar"></i>
                    Your Assessment Scores
                </h3>
                
                <div style="display: grid; gap: 1rem;">
                    ${this.generateScoreBar('Urgency', this.formData.urgency_score, 10)}
                    ${this.generateScoreBar('Complexity', this.formData.complexity_score, 10)}
                    ${this.generateScoreBar('Readiness', this.formData.readiness_score, 10)}
                </div>
            </div>
        `;
    }
    
    generateScoreBar(label, score, maxScore) {
        const percentage = (score / maxScore) * 100;
        const color = score >= 7 ? '#ef4444' : score >= 4 ? '#f59e0b' : '#10b981';
        
        return `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600;">${label}</span>
                    <span style="color: var(--text-secondary);">${score}/${maxScore}</span>
                </div>
                <div style="height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: ${color}; border-radius: 4px; transition: width 0.5s ease;"></div>
                </div>
            </div>
        `;
    }
    
    generateNextSteps(routing) {
        const stepsConfig = {
            urgent: [
                '📞 Immediate broker assignment',
                '📋 Document review within the hour', 
                '⚡ Express processing initiated',
                '📱 Real-time updates via your preferred method'
            ],
            standard: [
                '📧 Quote delivered within 4 hours',
                '📋 Document checklist provided',
                '👥 Dedicated broker assignment',
                'Processing timeline confirmed'
            ],
            education: [
                '📚 Import guide sent to your email',
                '📅 Follow-up scheduled in 3-5 days',
                'Tips for working with suppliers',
                '🤝 We\'re here when you\'re ready to proceed'
            ],
            specialist: [
                '🔬 Specialist assignment within 2 hours',
                '📋 Detailed requirements analysis',
                '📞 Consultation call scheduled', 
                'Custom solution development'
            ]
        };
        
        const steps = stepsConfig[routing] || stepsConfig.standard;
        
        return `
            <div style="background: #f8f9fa; border-radius: 0.75rem; padding: 1.5rem;">
                <h3 style="margin-bottom: 1.5rem; color: var(--primary-color);">
                    <i class="fas fa-list-check"></i>
                    What Happens Next?
                </h3>
                
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${steps.map(step => `
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                            <i class="fas fa-check-circle" style="color: var(--success-color); margin-top: 0.125rem; flex-shrink: 0;"></i>
                            <span>${step}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    generateResetButton() {
        return `
            <div style="text-align: center; margin-top: 2rem; padding: 1.5rem; border-top: 1px solid var(--border-color);">
                <div class="quote-actions" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <button 
                        type="button" 
                        id="printQuoteBtn"
                        class="btn btn-primary print-btn"
                        style="padding: 1rem 2rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;"
                    >
                        <i class="fas fa-print"></i>
                        Print Quote
                    </button>
                    <button 
                        type="button" 
                        id="downloadSubmissionBtn"
                        class="btn btn-secondary"
                        style="padding: 1rem 2rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;"
                    >
                        <i class="fas fa-download"></i>
                        Download Data
                    </button>
                    <button 
                        type="button" 
                        id="resetFormBtn"
                        class="btn btn-secondary"
                        style="padding: 1rem 2rem; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;"
                    >
                        <i class="fas fa-redo"></i>
                        Start Over
                    </button>
                </div>
                <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">
                    Reference ID: ${this.generateReferenceId()}
                </p>
            </div>
        `;
    }
    
    clearSavedData() {
        localStorage.removeItem('easyFreightFormData');
    }
    
    printQuote() {
        // Generate comprehensive quote content
        const quoteContent = this.generateViewableQuoteContent();
        
        // Create viewable quote window
        const quoteWindow = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes');
        quoteWindow.document.write(quoteContent);
        quoteWindow.document.close();
    }
    
    generatePrintContent() {
        const routing = this.formData.routing_decision;
        const routingConfig = this.getRoutingConfig(routing);
        const referenceId = this.generateReferenceId();
        const currentDate = new Date().toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Easy Freight Quote - ${referenceId}</title>
                <meta charset="UTF-8">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Arial', sans-serif;
                    }
                    
                    @page {
                        size: A4;
                        margin: 2cm 2cm 2cm 2cm; /* Top, Right, Bottom, Left - A4 standard margins */
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #333;
                        background: white;
                        margin: 0;
                        padding: 20px; /* Add padding to prevent content from touching edges */
                    }
                    
                    .page-content {
                        max-width: calc(210mm - 40px); /* A4 width minus padding */
                        margin: 0 auto;
                        background: white;
                        padding: 0; /* Remove internal padding since body has it */
                    }
                    
                    .header {
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .company-logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 5px;
                    }
                    
                    .company-tagline {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 15px;
                    }
                    
                    .quote-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    
                    .quote-title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .quote-details {
                        text-align: right;
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .content-section {
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 5px;
                    }
                    
                    .customer-info {
                        background: #f8f9fa;
                        padding: 12mm;
                        border-radius: 3mm;
                        margin-bottom: 15mm;
                        border: 1px solid #dee2e6;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12mm;
                        margin-bottom: 10mm;
                    }
                    
                    .info-item {
                        margin-bottom: 4mm;
                    }
                    
                    .info-label {
                        font-weight: bold;
                        color: #555;
                        display: inline-block;
                        min-width: 120px;
                    }
                    
                    .pricing-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 12mm 0;
                        border: 2px solid #333;
                    }
                    
                    .pricing-table th,
                    .pricing-table td {
                        padding: 4mm;
                        text-align: left;
                        border-bottom: 1px solid #666;
                        vertical-align: top;
                    }
                    
                    .pricing-table th {
                        background: #007bff;
                        color: white;
                        font-weight: bold;
                    }
                    
                    .pricing-table .total-row {
                        background: #f8f9fa;
                        font-weight: bold;
                    }
                    
                    .pricing-table .subtotal-row {
                        border-top: 2px solid #007bff;
                        background: #e3f2fd;
                    }
                    
                    .status-badge {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    
                    .status-urgent { background: #ffecb3; color: #f57c00; }
                    .status-standard { background: #c8e6c9; color: #388e3c; }
                    .status-education { background: #e1bee7; color: #7b1fa2; }
                    .status-specialist { background: #ffcdd2; color: #d32f2f; }
                    
                    .footer {
                        margin-top: 30mm;
                        padding-top: 15mm;
                        border-top: 2px solid #e9ecef;
                        font-size: 11pt;
                        color: #666;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    
                    .important-note {
                        background: #fff9e6;
                        border: 2px solid #ffc107;
                        border-radius: 5px;
                        padding: 12mm;
                        margin: 15mm 0;
                        page-break-inside: avoid;
                    }
                    
                    .important-note h4 {
                        color: #856404;
                        margin-bottom: 8mm;
                        font-size: 13pt;
                        font-weight: bold;
                    }
                    
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 20mm; /* Standard A4 margins */
                        }
                        
                        body { 
                            margin: 0; 
                            padding: 20px 20px 20px 20px; /* Extra top padding, standard sides and bottom */
                            padding-top: 40px; /* Additional top padding for better spacing */
                            font-size: 12pt;
                            line-height: 1.4;
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                        }
                        
                        .page-content {
                            max-width: none;
                            width: 100%;
                        }
                        
                        .header { 
                            page-break-after: avoid;
                            margin-bottom: 20mm;
                        }
                        
                        .content-section { 
                            page-break-inside: avoid;
                            margin-bottom: 12mm;
                        }
                        
                        .pricing-table {
                            font-size: 11pt;
                        }
                        
                        .no-print { 
                            display: none; 
                        }
                        
                        /* Ensure adequate spacing for A4 */
                        h1 { font-size: 18pt; margin-bottom: 8mm; }
                        h2 { font-size: 16pt; margin-bottom: 6mm; }
                        h3 { font-size: 14pt; margin-bottom: 5mm; }
                        h4 { font-size: 13pt; margin-bottom: 4mm; }
                        
                        p { margin-bottom: 4mm; }
                        
                        .company-logo {
                            font-size: 22pt;
                            margin-bottom: 4mm;
                        }
                        
                        .company-tagline {
                            font-size: 13pt;
                            margin-bottom: 12mm;
                        }
                        
                        .quote-title {
                            font-size: 20pt;
                        }
                        
                        .quote-details {
                            font-size: 10pt;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page-content">
                    <div class="header">
                    <img src="https://easyfreight.co.nz/wp-content/themes/easyfreight/img/logo.svg" 
                         alt="Easy Freight" 
                         class="company-logo-img"
                         style="height: 50px; margin-bottom: 10px; filter: brightness(0) saturate(100%) invert(8%) sepia(17%) saturate(4858%) hue-rotate(246deg) brightness(92%) contrast(98%);">
                    <div class="company-tagline">New Zealand's Leading Customs Clearance Specialists</div>
                    <div class="quote-info">
                        <div class="quote-title">Customs Clearance Quote</div>
                        <div class="quote-details">
                            <div>Reference: ${referenceId}</div>
                            <div>Date: ${currentDate}</div>
                        </div>
                    </div>
                </div>

                <div class="content-section">
                    <div class="section-title">Customer Information</div>
                    <div class="customer-info">
                        <div class="info-grid">
                            <div>
                                <div class="info-item">
                                    <span class="info-label">Name:</span>
                                    ${this.formData.first_name} ${this.formData.last_name}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email:</span>
                                    ${this.formData.email}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Phone:</span>
                                    ${this.formData.phone}
                                </div>
                                ${this.formData.company_name ? `
                                <div class="info-item">
                                    <span class="info-label">Company:</span>
                                    ${this.formData.company_name}
                                </div>
                                ` : ''}
                            </div>
                            <div>
                                <div class="info-item">
                                    <span class="info-label">Direction:</span>
                                    ${this.formData.direction === 'import' ? 'To New Zealand' : 'From New Zealand'}
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Customer Type:</span>
                                    ${this.formData.customer_type === 'business' ? 'Business' : 'Personal'}
                                </div>
                                ${this.formData.goods_location ? `
                                <div class="info-item">
                                    <span class="info-label">Goods Status:</span>
                                    ${this.getLocationDisplayText(this.formData.goods_location)}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="content-section">
                    <div class="section-title">Shipment Details</div>
                    ${this.generatePrintShipmentDetails()}
                </div>

                ${this.shouldShowPricing() ? this.generatePrintPricing() : this.generatePrintSpecialistInfo()}

                <div class="important-note">
                    <h4>Important Information</h4>
                    <p><strong>Quote Validity:</strong> This quote is valid for 30 days from the date issued.</p>
                    <p><strong>Payment Terms:</strong> Service fees are payable upfront. Government fees (customs, duty, GST) are collected separately upon clearance.</p>
                    <p><strong>Additional Charges:</strong> May apply for complex shipments, multiple suppliers, or special requirements.</p>
                    ${routing === 'education' ? '<p><strong>Planning Phase:</strong> This is an estimated quote for planning purposes. Final pricing will be confirmed when goods are ready to ship.</p>' : ''}
                </div>

                <div class="footer">
                    <p><strong>Easy Freight Ltd</strong> | Auckland, New Zealand</p>
                    <p>Email: sales@easyfreight.co.nz | Phone: +64 (9) 215-4654</p>
                    <p>Licensed Customs Broker | MPI Accredited | 24/7 Emergency Support Available</p>
                </div>
                </div>
            </body>
            </html>
        `;
    }
    
    generateViewableQuoteContent() {
        const routing = this.formData.routing_decision;
        const routingConfig = this.getRoutingConfig(routing);
        const referenceId = this.generateReferenceId();
        const currentDate = new Date().toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Easy Freight Quote - ${referenceId}</title>
                <meta charset="UTF-8">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Arial', sans-serif;
                    }
                    
                    @media print {
                        @page {
                            size: A4;
                            margin: 1.5cm 2cm 2cm 2cm; /* Optimised margins for quotes */
                        }
                        
                        body {
                            background: white !important;
                        }
                        
                        .page-content {
                            box-shadow: none !important;
                            border-radius: 0 !important;
                            padding: 0 !important;
                        }
                    }
                    
                    body {
                        font-family: 'Arial', sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #333;
                        background: #f8f9fa;
                        margin: 0;
                        padding: 20px;
                    }
                    
                    .page-content {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    
                    .header {
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .company-logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 5px;
                    }
                    
                    .company-tagline {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 15px;
                    }
                    
                    .quote-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    
                    .quote-title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .quote-details {
                        text-align: right;
                        font-size: 12px;
                        color: #666;
                    }
                    
                    .content-section {
                        margin-bottom: 30px;
                        page-break-inside: avoid;
                    }
                    
                    .section-title {
                        font-size: 18px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 15px;
                        border-bottom: 1px solid #e9ecef;
                        padding-bottom: 5px;
                    }
                    
                    .customer-info, .payment-info {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 6px;
                        margin-bottom: 20px;
                        border: 1px solid #dee2e6;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 15px;
                    }
                    
                    .info-item {
                        margin-bottom: 8px;
                    }
                    
                    .info-label {
                        font-weight: bold;
                        color: #555;
                        display: inline-block;
                        min-width: 120px;
                    }
                    
                    .pricing-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border: 2px solid #333;
                    }
                    
                    .pricing-table th,
                    .pricing-table td {
                        border: 1px solid #333;
                        padding: 12px;
                        text-align: left;
                    }
                    
                    .pricing-table th {
                        background: #007bff;
                        color: white;
                        font-weight: bold;
                    }
                    
                    .subtotal-row {
                        background: #f8f9fa;
                        font-weight: bold;
                    }
                    
                    .total-row {
                        background: #007bff;
                        color: white;
                        font-weight: bold;
                    }
                    
                    .print-controls {
                        text-align: center;
                        margin-bottom: 30px;
                        padding: 20px;
                        background: #e3f2fd;
                        border-radius: 6px;
                    }
                    
                    .print-btn {
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin: 0 10px;
                    }
                    
                    .print-btn:hover {
                        background: #0056b3;
                    }
                    
                    @media print {
                        .print-controls {
                            display: none;
                        }
                        
                        body {
                            background: white;
                            padding: 0;
                        }
                        
                        .page-content {
                            box-shadow: none;
                            padding: 0;
                        }
                    }
                    
                    .payment-methods {
                        margin-top: 15px;
                    }
                    
                    .payment-method {
                        margin-bottom: 15px;
                        padding: 15px;
                        border: 1px solid #dee2e6;
                        border-radius: 6px;
                        background: white;
                    }
                    
                    .payment-method h4 {
                        color: #007bff;
                        margin-bottom: 8px;
                    }
                    
                    .stripe-link {
                        background: #6772e5;
                        color: white;
                        padding: 8px 16px;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                        margin-top: 10px;
                    }
                    
                    .bank-details {
                        font-family: 'Arial', sans-serif;
                        background: #f8f9fa;
                        padding: 10px;
                        border-radius: 4px;
                        margin-top: 10px;
                        font-weight: 500;
                    }
                </style>
                <script>
                    function printWithOptimalSettings() {
                        // Configure optimal print settings
                        const printCSS = \`
                            @page {
                                size: A4;
                                margin: 1.5cm 2cm 2cm 2cm; /* Optimal margins: Top 1.5cm, Others 2cm */
                            }
                            
                            @media print {
                                body {
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    font-family: 'Arial', sans-serif !important;
                                    font-size: 12px !important;
                                    line-height: 1.4 !important;
                                }
                                
                                .page-content {
                                    max-width: 100% !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    box-shadow: none !important;
                                    border-radius: 0 !important;
                                }
                                
                                .print-controls {
                                    display: none !important;
                                }
                                
                                /* Ensure content fits well */
                                .content-section {
                                    page-break-inside: avoid;
                                    margin-bottom: 15px !important;
                                }
                                
                                /* Ensure consistent fonts for all elements */
                                *, *::before, *::after {
                                    font-family: 'Arial', sans-serif !important;
                                }
                                
                                /* Optimize tables for print */
                                table {
                                    font-size: 11px !important;
                                    font-family: 'Arial', sans-serif !important;
                                }
                                
                                /* Consistent fonts for all text elements */
                                h1, h2, h3, h4, h5, h6, p, div, span, td, th {
                                    font-family: 'Arial', sans-serif !important;
                                }
                                
                                /* Bank details and packing info consistency */
                                .bank-details, .packing-info {
                                    font-family: 'Arial', sans-serif !important;
                                }
                                
                                /* Ensure headers don't break */
                                h3, h4, .section-title {
                                    page-break-after: avoid;
                                    font-family: 'Arial', sans-serif !important;
                                }
                            }
                        \`;
                        
                        // Create and append print-specific styles
                        const styleElement = document.createElement('style');
                        styleElement.textContent = printCSS;
                        document.head.appendChild(styleElement);
                        
                        // Trigger print dialog
                        window.print();
                        
                        // Clean up - remove the temporary styles after printing
                        setTimeout(() => {
                            document.head.removeChild(styleElement);
                        }, 1000);
                    }
                </script>
            </head>
            <body>
                <div class="print-controls">
                    <h3>Easy Freight Quote</h3>
                    <p>Review your quote below. Click Print to generate a hard copy with optimal A4 margins.</p>
                    <p style="font-size: 12px; color: #666; margin-bottom: 15px;">
                        Print settings automatically configured for professional formatting
                    </p>
                    <button class="print-btn" onclick="printWithOptimalSettings()">Print Quote</button>
                    <button class="print-btn" onclick="window.close()" style="background: #6c757d;">Close</button>
                </div>
                
                <div class="page-content">
                    <div class="header">
                        <img src="https://easyfreight.co.nz/wp-content/themes/easyfreight/img/logo.svg" 
                             alt="Easy Freight" 
                             class="company-logo-img"
                             style="height: 50px; margin-bottom: 10px; filter: brightness(0) saturate(100%) invert(8%) sepia(17%) saturate(4858%) hue-rotate(246deg) brightness(92%) contrast(98%);">
                        <div class="company-tagline">Licensed Customs Broker & Freight Forwarder</div>
                        <div class="quote-info">
                            <div class="quote-title">Customs Clearance Quote</div>
                            <div class="quote-details">
                                <div>Reference: ${referenceId}</div>
                                <div>Date: ${currentDate}</div>
                                <div>Valid: 30 Days</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">Customer Information</div>
                        <div class="customer-info">
                            <div class="info-grid">
                                <div>
                                    <div class="info-item">
                                        <span class="info-label">Name:</span>
                                        ${this.formData.first_name} ${this.formData.last_name}
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Email:</span>
                                        ${this.formData.email}
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Phone:</span>
                                        ${this.formData.phone}
                                    </div>
                                </div>
                                <div>
                                    ${this.formData.company_name ? `
                                    <div class="info-item">
                                        <span class="info-label">Company:</span>
                                        ${this.formData.company_name}
                                    </div>
                                    ` : ''}
                                    <div class="info-item">
                                        <span class="info-label">Service:</span>
                                        ${this.formData.direction === 'import' ? 'Import to NZ' : 'Export from NZ'}
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Customer Type:</span>
                                        ${this.formData.customer_type === 'business' ? 'Business' : 'Personal'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">Shipment Details</div>
                        ${this.generatePrintShipmentDetails()}
                    </div>
                    
                    ${this.shouldShowPricing() ? this.generatePrintPricing() : this.generatePrintSpecialistInfo()}
                    
                    <div class="content-section">
                        <div class="section-title">Payment Information</div>
                        <div class="payment-info">
                            <p><strong>Important Information:</strong></p>
                            <p>This quote is valid for 30 days. Your work will be assigned to a specialist upon receipt of payment.</p>
                            
                            <div class="payment-methods">
                                <h4>Payment Methods:</h4>
                                
                                <div class="payment-method">
                                    <h4>1) Pay by Credit/Debit Card</h4>
                                    <p>Securely pay online via Stripe (Convenience fee included).</p>
                                    <a href="#" class="stripe-link" onclick="alert('Stripe integration: Quote ID ${referenceId}')">Pay Online Now</a>
                                    <p style="font-size: 12px; margin-top: 8px; color: #666;">Note: Stripe integration will use Quote ID: ${referenceId}</p>
                                </div>
                                
                                <div class="payment-method">
                                    <h4>2) Pay by Bank Transfer</h4>
                                    <p>Please use the account details below:</p>
                                    <div class="bank-details">
                                        <strong>Account Name:</strong> Easy Freight Limited<br>
                                        <strong>Bank:</strong> Kiwibank<br>
                                        <strong>Account Number:</strong> 38-9011-0154540-00<br>
                                        <strong>Reference:</strong> ${referenceId}
                                    </div>
                                    <p style="margin-top: 10px; font-size: 14px; color: #666;">
                                        Please include your Quote Reference <strong>#${referenceId}</strong><br>
                                        Allow 6 hours to confirm payment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="content-section">
                        <div class="section-title">Contact Information</div>
                        <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 6px;">
                            <h3 style="color: #007bff; margin-bottom: 10px;">Easy Freight</h3>
                            <p>Email: sales@easyfreight.co.nz | Phone: +64 (9) 215-4654</p>
                            <p>Licensed Customs Broker | MPI Accredited | 24/7 Emergency Support Available</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    generatePrintShipmentDetails() {
        let details = '<div class="info-grid">';
        
        details += '<div>';
        if (this.formData.cargo_type) {
            details += `
                <div class="info-item">
                    <span class="info-label">Cargo Type:</span>
                    ${this.getCargoTypeDisplayText(this.formData.cargo_type)}
                </div>
            `;
        }
        
        if (this.formData.shipment_method) {
            details += `
                <div class="info-item">
                    <span class="info-label">Shipping Method:</span>
                    ${this.getShipmentMethodDisplayText(this.formData.shipment_method)}
                </div>
            `;
        }
        
        if (this.formData.container_type) {
            details += `
                <div class="info-item">
                    <span class="info-label">Container:</span>
                    ${this.formData.container_type.toUpperCase()}
                </div>
            `;
        }
        
        if (this.formData.air_weight_category) {
            details += `
                <div class="info-item">
                    <span class="info-label">Weight Category:</span>
                    ${this.formData.air_weight_category === 'under_100kg' ? 'Under 100kg' : 'Over 100kg'}
                </div>
            `;
        }
        details += '</div>';
        
        details += '<div>';
        if (this.formData.shipping_payment) {
            details += `
                <div class="info-item">
                    <span class="info-label">Payment Terms:</span>
                    ${this.getPaymentTermsDisplayText(this.formData.shipping_payment)}
                </div>
            `;
        }
        
        if (this.formData.local_delivery) {
            details += `
                <div class="info-item">
                    <span class="info-label">Delivery Service:</span>
                    ${this.formData.local_delivery === 'yes' ? 'Required' : 'Not Required'}
                </div>
            `;
        }
        
        // Add delivery address if provided
        if (this.formData.needs_port_delivery === 'yes' && this.formData.delivery_address && this.formData.delivery_address.trim()) {
            const isExport = this.formData.direction === 'export';
            const label = isExport ? 'Collection Address' : 'Delivery Address';
            details += `
                <div class="info-item">
                    <span class="info-label">${label}:</span>
                    ${this.formData.delivery_address.trim()}
                </div>
            `;
        }
        
        if (this.formData.customs_code_status === 'have_code' && this.formData.customs_client_code) {
            details += `
                <div class="info-item">
                    <span class="info-label">Customs Code:</span>
                    ${this.formData.customs_client_code}
                </div>
            `;
        }
        details += '</div>';
        
        details += '</div>';
        
        // Add packing information if available
        if (this.formData.packing_info_combined) {
            details += `
                <div style="margin-top: 15px;">
                    <div class="info-label" style="display: block; margin-bottom: 8px;">Packing Information:</div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4;">
                        ${this.formData.packing_info_combined}
                    </div>
                </div>
            `;
        }
        
        return details;
    }
    
    generatePrintPricing() {
        const complexity = this.calculateComplexityScore();
        const urgency = this.calculateUrgencyScore();
        
        const baseFee = 197;
        let serviceFee = baseFee;
        
        // Add complexity and urgency fees
        if (complexity > 6) serviceFee += 90;
        if (urgency === 1) serviceFee += 75;
        if (urgency === 2) serviceFee += 50;
        
        // Customs code fee
        const customsCodeFee = this.formData.customs_code_status === 'need_help' ? 95 : 0;
        
        // BIO security fee (required for all food/beverages cargo)
        const bioSecurityFee = this.formData.cargo_type === 'food_beverages' ? 67 : 0;
        
        // Local delivery fee
        const localDeliveryFee = this.formData.needs_port_delivery === 'yes' ? 0 : 0; // Variable pricing
        
        const serviceSubtotal = serviceFee + customsCodeFee + bioSecurityFee;
        const serviceGST = serviceSubtotal * 0.15;
        const serviceTotal = serviceSubtotal + serviceGST;
        
        return `
            <div class="content-section">
                <div class="section-title">Pricing Estimate</div>
                
                <table class="pricing-table">
                    <thead>
                        <tr>
                            <th style="width: 60%;">Service</th>
                            <th style="width: 20%; text-align: center;">Rate</th>
                            <th style="width: 20%; text-align: right;">Amount (NZD)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Customs Clearance (Base)*</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $${baseFee.toFixed(2)}</td>
                        </tr>
                        ${complexity > 6 ? `
                        <tr>
                            <td>Complex Cargo Handling</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $90.00</td>
                        </tr>
                        ` : ''}
                        ${urgency === 1 ? `
                        <tr>
                            <td>Urgent Processing (Goods Arrived)</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $75.00</td>
                        </tr>
                        ` : ''}
                        ${urgency === 2 ? `
                        <tr>
                            <td>Priority Processing (1-2 Days)</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $50.00</td>
                        </tr>
                        ` : ''}
                        ${customsCodeFee > 0 ? `
                        <tr>
                            <td>Customs Client Code Application</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $${customsCodeFee.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        ${bioSecurityFee > 0 ? `
                        <tr>
                            <td>BIO Security</td>
                            <td style="text-align: center;">Fixed</td>
                            <td style="text-align: right;">NZD $${bioSecurityFee.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        ${this.formData.needs_port_delivery === 'yes' ? `
                        <tr>
                            <td>Local Delivery Service</td>
                            <td style="text-align: center;">Variable</td>
                            <td style="text-align: right;">Variable*</td>
                        </tr>
                        ` : ''}
                        <tr class="subtotal-row">
                            <td colspan="2"><strong>Subtotal (Excl. GST)</strong></td>
                            <td style="text-align: right;"><strong>NZD $${serviceSubtotal.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="2">GST (15%)</td>
                            <td style="text-align: right;">NZD $${serviceGST.toFixed(2)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="2"><strong>Total Service Fee (Incl. GST)</strong></td>
                            <td style="text-align: right;"><strong>NZD $${serviceTotal.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 10px;">Government Fees (Collected Separately)</h4>
                    <table class="pricing-table">
                        <tbody>
                            <tr>
                                <td>Customs Transaction Fee (CTF)</td>
                                <td style="text-align: right;">NZD $106.80</td>
                            </tr>
                            <tr>
                                <td>Import Duty</td>
                                <td style="text-align: right;">Variable*</td>
                            </tr>
                            <tr>
                                <td>GST on Goods (15%)</td>
                                <td style="text-align: right;">Variable*</td>
                            </tr>
                            ${this.formData.cargo_type === 'food_beverages' ? `
                            <tr>
                                <td>MPI Biosecurity Fees</td>
                                <td style="text-align: right;">Variable*</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    <div style="margin-top: 15px; font-size: 11pt; color: #666;">
                        <p style="margin-bottom: 8px;"><strong>*Our rate includes the classification of 5 invoice lines. Each additional line costs NZD $5 + GST per line.</strong></p>
                        <p style="margin-bottom: 8px;"><strong>*Government fees depend on goods classification, origin country, and declared value.</strong></p>
                        ${this.formData.needs_port_delivery === 'yes' ? '<p style="margin-bottom: 8px;"><strong>*Local delivery pricing is variable - our delivery specialist will contact you for details.</strong></p>' : ''}
                        <p style="margin-bottom: 0;"><strong>Payment Terms:</strong> Easy Freight service fee payable before work begins. Government fees collected separately when known.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    generatePrintSpecialistInfo() {
        return `
            <div class="content-section">
                <div class="section-title">Specialist Review Required</div>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; border-left: 4px solid #2196f3;">
                    <h4 style="color: #1976d2; margin-bottom: 10px;">Your shipment requires expert attention</h4>
                    <p style="margin-bottom: 15px;">
                        Based on your cargo type and requirements, our specialist team will provide a detailed quote 
                        and guidance within ${this.getRoutingConfig(this.formData.routing_decision).responseTime}.
                    </p>
                    <p style="margin-bottom: 10px;"><strong>What happens next:</strong></p>
                    <ul style="margin-left: 20px; margin-bottom: 15px;">
                        <li>Our specialist will review your requirements</li>
                        <li>We'll provide detailed pricing and timeline</li>
                        <li>Any special permits or documentation will be arranged</li>
                        <li>You'll receive step-by-step guidance throughout the process</li>
                    </ul>
                    <p style="font-size: 12px; color: #666;">
                        This ensures compliance and the smoothest possible clearance for your goods.
                    </p>
                </div>
            </div>
        `;
    }
    
    // Exit intent modal
    showExitIntent() {
        if (this.hasShownExitIntent) return;
        this.hasShownExitIntent = true;
        
        const modal = document.getElementById('exitModal');
        modal.style.display = 'flex';
        
        // Bind exit modal events
        document.getElementById('exitModalClose').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('exitModalCancel').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('exitModalSubmit').addEventListener('click', () => {
            this.handleQuickQuote();
            modal.style.display = 'none';
        });
    }
    
    handleQuickQuote() {
        const email = document.getElementById('quickEmail').value;
        const cargo = document.getElementById('quickCargo').value;
        
        if (email && cargo) {
            // Simulate sending quick quote
            alert(`Quick quote request sent to ${email} for ${cargo}. Check your email in 5 minutes!`);
        }
    }
    
    // Helper methods for print display text
    getLocationDisplayText(location) {
        const locationMap = {
            'arrived': 'Arrived in New Zealand',
            'in_transit_1_2_days': 'Arriving in 1-2 days',
            'in_transit_1_week': 'Arriving within 1 week',
            'not_shipped': 'Not shipped yet (planning)'
        };
        return locationMap[location] || location;
    }
    
    getCargoTypeDisplayText(cargoType) {
        const cargoMap = {
            'general_goods': 'General Goods',
            'food_beverages': 'Food & Beverages',
            'personal_effects': 'Personal Effects',
            'vehicles_machinery': 'Vehicles & Machinery',
            'hazardous': 'Hazardous Materials',
            'other': 'Other'
        };
        return cargoMap[cargoType] || cargoType;
    }
    
    getShipmentMethodDisplayText(method) {
        const methodMap = {
            'sea': 'Sea Freight',
            'air': 'Air Freight',
            'courier': 'Courier',
            'not_sure': 'Not Sure / Planning'
        };
        return methodMap[method] || method;
    }
    
    getPaymentTermsDisplayText(terms) {
        const termsMap = {
            'cif_ddu': 'CIF/DDU - Supplier arranges shipping',
            'fob': 'FOB - I arrange shipping from port',
            'exw_fca': 'EXW/FCA - I arrange everything from origin'
        };
        return termsMap[terms] || terms;
    }
    
    downloadSubmission() {
        // Ask user for preferred format
        const userChoice = confirm('Choose download format:\n\nOK = Human-readable text file\nCancel = Technical JSON data');
        
        if (userChoice) {
            this.downloadReadableSubmission();
        } else {
            this.downloadJSONSubmission();
        }
    }
    
    downloadReadableSubmission() {
        // Generate human-readable submission summary
        const submissionText = this.generateReadableSubmissionText();
        
        // Create filename with timestamp
        const timestamp = new Date().toLocaleDateString('en-NZ').replace(/\//g, '-');
        const referenceId = this.generateReferenceId();
        const filename = `EasyFreight_Quote_${referenceId}_${timestamp}.txt`;
        
        // Create downloadable file
        const dataBlob = new Blob([submissionText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(dataBlob);
        
        // Create download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Cleanup
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert(`Submission summary downloaded as ${filename}`);
    }
    
    downloadJSONSubmission() {
        // Generate comprehensive technical data
        const submissionData = this.generateSubmissionData();
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const referenceId = submissionData.metadata.submissionId;
        const filename = `EasyFreight_Data_${referenceId}_${timestamp}.json`;
        
        // Create downloadable file
        const dataStr = JSON.stringify(submissionData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        
        // Create download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Cleanup
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        alert(`Technical data downloaded as ${filename}`);
    }
    
    generateReadableSubmissionText() {
        const routing = this.formData.routing_decision;
        const routingConfig = this.getRoutingConfig(routing);
        const timestamp = new Date().toLocaleString('en-NZ');
        const referenceId = this.generateReferenceId();
        
        let text = `EASY FREIGHT - CUSTOMS CLEARANCE QUOTE SUBMISSION\n`;
        text += `${'='.repeat(55)}\n\n`;
        
        text += `Reference ID: ${referenceId}\n`;
        text += `Submitted: ${timestamp}\n`;
        text += `Status: ${routingConfig.title}\n\n`;
        
        // Customer Information
        text += `CUSTOMER INFORMATION\n`;
        text += `${'-'.repeat(25)}\n`;
        text += `Name: ${this.formData.first_name} ${this.formData.last_name}\n`;
        text += `Email: ${this.formData.email}\n`;
        text += `Phone: ${this.formData.phone}\n`;
        if (this.formData.company_name) {
            text += `Company: ${this.formData.company_name}\n`;
        }
        text += `Customer Type: ${this.formData.customer_type === 'business' ? 'Business' : 'Personal'}\n\n`;
        
        // Shipment Details
        text += `SHIPMENT DETAILS\n`;
        text += `${'-'.repeat(20)}\n`;
        text += `Direction: ${this.formData.direction === 'import' ? 'To New Zealand' : 'From New Zealand'}\n`;
        if (this.formData.goods_location) {
            text += `Goods Status: ${this.getLocationDisplayText(this.formData.goods_location)}\n`;
        }
        if (this.formData.shipment_method) {
            text += `Shipping Method: ${this.getShipmentMethodDisplayText(this.formData.shipment_method)}\n`;
        }
        if (this.formData.container_type) {
            text += `Container Type: ${this.formData.container_type.toUpperCase()}\n`;
        }
        if (this.formData.shipping_payment) {
            text += `Payment Terms: ${this.getPaymentTermsDisplayText(this.formData.shipping_payment)}\n`;
        }
        if (this.formData.local_delivery) {
            text += `Local Delivery: ${this.formData.local_delivery === 'yes' ? 'Required' : 'Not Required'}\n`;
        }
        // Add delivery address if provided
        if (this.formData.needs_port_delivery === 'yes' && this.formData.delivery_address && this.formData.delivery_address.trim()) {
            const isExport = this.formData.direction === 'export';
            const label = isExport ? 'Collection Address' : 'Delivery Address';
            text += `${label}: ${this.formData.delivery_address.trim()}\n`;
        }
        text += `\n`;
        
        // Cargo Information
        if (this.formData.cargo_type) {
            text += `CARGO INFORMATION\n`;
            text += `${'-'.repeat(20)}\n`;
            text += `Cargo Type: ${this.getCargoTypeDisplayText(this.formData.cargo_type)}\n`;
            if (this.formData.cargo_details) {
                text += `Details: ${this.formData.cargo_details}\n`;
            }
            if (this.formData.personal_item_condition) {
                text += `Condition: ${this.formData.personal_item_condition}\n`;
            }
            if (this.formData.requires_temperature_control !== undefined) {
                text += `Temperature Control: ${this.formData.requires_temperature_control ? 'Required' : 'Not Required'}\n`;
            }
            text += `\n`;
        }
        
        // Packing Information
        if (this.formData.packing_info_combined) {
            text += `PACKING INFORMATION\n`;
            text += `${'-'.repeat(22)}\n`;
            text += `${this.formData.packing_info_combined}\n\n`;
        }
        
        // Documents Status
        const docStatuses = this.formData.document_status || {};
        if (Object.keys(docStatuses).length > 0) {
            text += `DOCUMENT STATUS\n`;
            text += `${'-'.repeat(18)}\n`;
            Object.entries(docStatuses).forEach(([docId, status]) => {
                const statusText = status === 'uploaded' ? 'Uploaded' : 
                                 status === 'dont_have' ? 'Not Available' : 
                                 status === 'will_provide' ? 'Will Provide Later' : 'Unknown';
                text += `${docId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${statusText}\n`;
            });
            text += `\n`;
        }
        
        // Customs Code
        if (this.formData.customs_code_status) {
            text += `CUSTOMS CODE INFORMATION\n`;
            text += `${'-'.repeat(27)}\n`;
            text += `Status: ${this.formData.customs_code_status === 'have_code' ? 'Have Existing Code' : 
                              this.formData.customs_code_status === 'apply_for_me' ? 'Please Apply For Me' : 'Unknown'}\n`;
            if (this.formData.customs_client_code) {
                text += `Code: ${this.formData.customs_client_code}\n`;
            }
            text += `\n`;
        }
        
        // Pricing (if available)
        if (this.shouldShowPricing()) {
            const pricing = this.calculatePricingEstimate();
            text += `ESTIMATED PRICING\n`;
            text += `${'-'.repeat(20)}\n`;
            text += `Customs Clearance (Base): NZD $197.00\n`;
            if (pricing.customsCodeFee > 0) {
                text += `Customs Client Code Application: NZD $${pricing.customsCodeFee.toFixed(2)}\n`;
            }
            if (pricing.specialHandlingFee > 0) {
                text += `BIO Security: NZD $${pricing.specialHandlingFee.toFixed(2)}\n`;
            }
            text += `Service Fee (excl. GST): NZD $${pricing.serviceTotal.toFixed(2)}\n`;
            text += `GST (15%): NZD $${pricing.gstOnServices.toFixed(2)}\n`;
            text += `Total Service Fee: NZD $${pricing.totalServiceFee.toFixed(2)}\n\n`;
            
            // Add local delivery as separate section if required
            if (this.formData.needs_port_delivery === 'yes') {
                text += `LOCAL DELIVERY SERVICE\n`;
                text += `${'-'.repeat(25)}\n`;
                text += `Local Delivery: Variable*\n\n`;
            }
            
            text += `GOVERNMENT FEES (Payable at Clearance)\n`;
            text += `${'-'.repeat(38)}\n`;
            text += `Customs Transaction Fee: NZD $106.80\n`;
            text += `Import Duty: Variable (depends on goods classification)\n`;
            text += `GST on Goods: 15% of value + duty + fees\n`;
            if (this.formData.cargo_type === 'food_beverages') {
                text += `MPI Biosecurity Fees: Variable\n`;
            }
            text += `\n`;
        }
        
        // Important Notes
        text += `IMPORTANT NOTES\n`;
        text += `${'-'.repeat(18)}\n`;
        text += `• This submission has been recorded with reference ${referenceId}\n`;
        text += `• Service fees are payable before work begins\n`;
        text += `• Government fees are collected separately when known\n`;
        text += `• Pricing includes classification of up to 5 invoice lines\n`;
        text += `• Additional lines cost NZD $5 + GST each\n`;
        if (this.formData.needs_port_delivery === 'yes') {
            text += `• Local delivery pricing is variable* - our delivery specialist will contact you\n`;
        }
        text += `\n`;
        
        // Contact Information
        text += `EASY FREIGHT CONTACT INFORMATION\n`;
        text += `${'-'.repeat(35)}\n`;
        text += `Email: sales@easyfreight.co.nz\n`;
        text += `Phone: +64 (9) 215-4654\n`;
        text += `Licensed Customs Broker | MPI Accredited\n`;
        
        return text;
    }
    
    generateSubmissionData() {
        const routing = this.formData.routing_decision;
        const routingConfig = this.getRoutingConfig(routing);
        const timestamp = new Date().toISOString();
        const referenceId = this.generateReferenceId();
        
        // Calculate scores and pricing (if applicable)
        const urgencyScore = this.calculateUrgencyScore();
        const complexityScore = this.calculateComplexityScore();
        const readinessScore = this.calculateReadinessScore();
        
        let pricingEstimate = null;
        if (this.shouldShowPricing()) {
            pricingEstimate = this.calculatePricingEstimate();
        }
        
        return {
            // Metadata
            metadata: {
                submissionId: referenceId,
                submittedAt: timestamp,
                formVersion: "2.0",
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            
            // Customer Information
            customer: {
                personalDetails: {
                    firstName: this.formData.first_name || '',
                    lastName: this.formData.last_name || '',
                    email: this.formData.email || '',
                    phone: this.formData.phone || '',
                    companyName: this.formData.company_name || '',
                    customerType: this.formData.customer_type || '',
                    consentGiven: this.formData.consent_checkbox || false
                }
            },
            
            // Shipment Details
            shipment: {
                direction: this.formData.direction || '',
                directionDisplay: this.formData.direction === 'import' ? 'To New Zealand' : 'From New Zealand',
                goodsLocation: this.formData.goods_location || '',
                goodsLocationDisplay: this.getLocationDisplayText(this.formData.goods_location),
                arrivalMethod: this.formData.arrival_method || '',
                arrivalTimeline: this.formData.arrival_timeline || '',
                
                shipping: {
                    method: this.formData.shipment_method || '',
                    methodDisplay: this.getShipmentMethodDisplayText(this.formData.shipment_method),
                    containerType: this.formData.container_type || '',
                    airWeightCategory: this.formData.air_weight_category || '',
                    paymentTerms: this.formData.shipping_payment || '',
                    paymentTermsDisplay: this.getPaymentTermsDisplayText(this.formData.shipping_payment),
                    localDelivery: this.formData.local_delivery || '',
                    destinationCountry: this.formData.destination_country || '',
                    exportServiceNeeded: this.formData.export_service_needed || ''
                },
                
                cargo: {
                    type: this.formData.cargo_type || '',
                    typeDisplay: this.getCargoTypeDisplayText(this.formData.cargo_type),
                    details: this.formData.cargo_details || '',
                    otherDescription: this.formData.other_cargo_description || '',
                    personalItemCondition: this.formData.personal_item_condition || '',
                    personalItemMixed: this.formData.personal_item_mixed || false,
                    requiresTemperatureControl: this.formData.requires_temperature_control,
                    needsPortDelivery: this.formData.needs_port_delivery || ''
                },
                
                packing: {
                    infoCombined: this.formData.packing_info_combined || '',
                    dimensions: this.formData.packing_dimensions || '',
                    totalPallets: this.formData.total_pallets || '',
                    palletWeight: this.formData.pallet_weight || ''
                },
                
                customs: {
                    codeStatus: this.formData.customs_code_status || '',
                    clientCode: this.formData.customs_client_code || '',
                    codeNumber: this.formData.customs_code_number || ''
                }
            },
            
            // Document Status
            documents: {
                status: this.formData.document_status || {},
                uploadedFiles: this.formData.uploaded_files || {}
            },
            
            // Scoring and Routing
            analysis: {
                routing: {
                    decision: routing || '',
                    title: routingConfig.title || '',
                    subtitle: routingConfig.subtitle || '',
                    responseTime: routingConfig.responseTime || ''
                },
                scores: {
                    urgency: urgencyScore,
                    complexity: complexityScore,
                    readiness: readinessScore
                },
                pricing: pricingEstimate
            },
            
            // Raw Form Data (for debugging/reference)
            rawFormData: this.formData,
            
            // System Information
            system: {
                currentStep: this.currentStep,
                totalSteps: this.totalSteps,
                visibleSteps: this.getVisibleSteps().map(step => ({
                    id: step.id,
                    title: step.title,
                    description: step.description
                })),
                completedAt: timestamp,
                processingNotes: [
                    `Urgency Score: ${urgencyScore}/10`,
                    `Complexity Score: ${complexityScore}/10`, 
                    `Readiness Score: ${readinessScore}/10`,
                    `Routing Decision: ${routingConfig.title}`,
                    pricingEstimate ? `Estimated Service Fee: NZD $${pricingEstimate.totalServiceFee.toFixed(2)}` : 'Specialist Review Required'
                ]
            }
        };
    }

    // ==================== AIRTABLE INTEGRATION METHODS ====================

    /**
     * Auto-save form progress to AirTable after each step (in-progress status)
     */
    async autoSaveToAirTable() {
        try {
            // Only auto-save if user has provided email (minimum required field)
            if (!this.formData.email) {
                return;
            }

            const API_ENDPOINT = window.AIRTABLE_API_ENDPOINT || '/api/submit-form';

            // Generate session ID if not exists
            if (!this.formData.session_id) {
                this.formData.session_id = this.generateSessionId();
            }

            // Prepare payload with in-progress status
            const payload = this.prepareAirTablePayload();
            payload.status = 'in_progress';

            // Backend will handle POST (new) vs PATCH (update) based on airtable_record_id
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.recordId) {
                    // Store record ID for future updates
                    if (!this.formData.airtable_record_id) {
                        this.formData.airtable_record_id = result.recordId;
                        console.log('✅ Auto-saved to AirTable (new record):', result.recordId);
                    } else {
                        console.log('✅ Auto-saved to AirTable (updated):', result.recordId);
                    }
                }
            }

            // Show auto-save indicator briefly
            this.showAutoSaveIndicator();

        } catch (error) {
            // Silent fail for auto-save - don't interrupt user experience
            console.log('Auto-save skipped:', error.message);
        }
    }

    /**
     * Show auto-save indicator briefly
     */
    showAutoSaveIndicator() {
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    /**
     * Submit form data to AirTable via backend API proxy
     */
    async submitToAirTable() {
        try {
            // Get API endpoint from environment or use default
            const API_ENDPOINT = window.AIRTABLE_API_ENDPOINT || '/api/submit-form';

            // Generate session ID if not exists
            if (!this.formData.session_id) {
                this.formData.session_id = this.generateSessionId();
            }

            // Prepare payload
            const payload = this.prepareAirTablePayload();

            // Submit to backend API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}: Submission failed`);
            }

            return result;

        } catch (error) {
            console.error('AirTable submission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Prepare AirTable payload from form data
     */
    prepareAirTablePayload() {
        return {
            // Contact Information
            first_name: this.formData.first_name,
            last_name: this.formData.last_name,
            email: this.formData.email,
            phone: this.formData.phone,
            company_name: this.formData.company_name || '',
            customer_type: this.formData.customer_type,
            consent_checkbox: this.formData.consent_checkbox,

            // Classification
            direction: this.formData.direction,

            // Import-specific (conditional)
            goods_location: this.formData.goods_location || '',
            arrival_method: this.formData.arrival_method || '',
            arrival_timeline: this.formData.arrival_timeline || '',
            customs_code_status: this.formData.customs_code_status || '',
            customs_code_number: this.formData.customs_code_number || '',

            // Export-specific (conditional)
            export_service_needed: this.formData.export_service_needed || '',
            destination_country: this.formData.destination_country || '',

            // Service Classification
            shipping_payment: this.formData.shipping_payment || '',
            local_delivery: this.formData.local_delivery || '',
            needs_port_delivery: this.formData.needs_port_delivery || '',
            delivery_address: this.formData.delivery_address || '',
            shipment_method: this.formData.shipment_method || '',
            container_type: this.formData.container_type || '',
            air_weight_category: this.formData.air_weight_category || '',

            // Cargo Details
            cargo_type: this.formData.cargo_type,
            cargo_details: this.formData.cargo_details || '',
            other_cargo_description: this.formData.other_cargo_description || '',
            personal_item_condition: this.formData.personal_item_condition || '',
            personal_item_mixed: this.formData.personal_item_mixed || false,
            requires_temperature_control: this.formData.requires_temperature_control || false,

            // Packing Information
            packing_info_combined: this.formData.packing_info_combined || '',

            // Document Status
            document_status: {
                air_waybill: this.formData.document_status?.air_waybill || '',
                bill_of_lading: this.formData.document_status?.bill_of_lading || '',
                courier_receipt: this.formData.document_status?.courier_receipt || '',
                commercial_invoice: this.formData.document_status?.commercial_invoice || '',
                packing_list: this.formData.document_status?.packing_list || '',
                export_declaration: this.formData.document_status?.export_declaration || '',
                msds: this.formData.document_status?.msds || ''
            },

            // System Fields
            status: 'completed',
            session_id: this.formData.session_id || this.generateSessionId(),

            // Include record ID if updating existing record
            airtable_record_id: this.formData.airtable_record_id || ''
        };
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `session_${timestamp}_${random}`;
    }

    /**
     * Show submission error to user
     */
    showSubmissionError(errorMessage) {
        const errorHtml = `
            <div style="
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin: 20px;
                text-align: center;
            ">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h3 style="color: #856404; margin-bottom: 10px;">Submission Error</h3>
                <p style="color: #856404; margin-bottom: 20px;">
                    We encountered an issue submitting your form. Please try again or contact us directly.
                </p>
                <div style="
                    background: #fff;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                    font-family: monospace;
                    font-size: 12px;
                    color: #d32f2f;
                ">
                    ${errorMessage}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" style="
                        padding: 12px 24px;
                        background: #ffc107;
                        color: #000;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        Try Again
                    </button>
                    <a href="mailto:sales@easyfreight.co.nz" style="
                        padding: 12px 24px;
                        background: #007bff;
                        color: #fff;
                        border: none;
                        border-radius: 4px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                    ">
                        Contact Us Directly
                    </a>
                </div>
            </div>
        `;

        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.innerHTML = errorHtml;
            formContainer.style.display = 'block';
        }
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.easyFreightForm = new EasyFreightForm();
    
    // Mobile viewport height fix for better button visibility
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Set initial viewport height
    setViewportHeight();
    
    // Update on resize (orientation change, keyboard appearance, etc.)
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
    
    // Handle iOS Safari viewport issues
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Fix viewport height on iOS
        function iosVhFix() {
            const container = document.querySelector('.container');
            if (container) {
                container.style.height = `${window.innerHeight}px`;
            }
        }
        
        iosVhFix();
        window.addEventListener('orientationchange', () => {
            setTimeout(iosVhFix, 500);
        });
    }
});