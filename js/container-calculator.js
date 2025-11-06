/**
 * Shipping Container Estimation Calculator
 * Comprehensive tool for calculating container space utilisation
 */

class ContainerCalculator {
    constructor() {
        this.products = [];
        this.nextProductId = 1;
        this.isAdvancedMode = false;
        this.selectedContainer = '20ft';
        this.customContainer = {
            length: 590,
            width: 235,
            height: 239,
            maxWeight: 28080
        };
        
        // Standard container specifications (internal dimensions in cm, weight in kg)
        this.containers = {
            '20ft': { length: 590, width: 235, height: 239, maxWeight: 28080, name: '20ft Standard' },
            '40ft': { length: 1200, width: 235, height: 239, maxWeight: 26760, name: '40ft Standard' },
            '40ft_hc': { length: 1200, width: 235, height: 269, maxWeight: 26760, name: '40ft High Cube' }
        };
        
        // Unit conversion factors to centimeters
        this.unitConversions = {
            mm: 0.1,
            cm: 1,
            m: 100,
            inches: 2.54,
            feet: 30.48
        };
        
        // Weight conversion factors to kilograms
        this.weightConversions = {
            kg: 1,
            g: 0.001,
            lbs: 0.453592,
            tons: 1000
        };
    }

    init() {
        this.createCalculatorPopup();
        this.bindEvents();
    }

    createCalculatorPopup() {
        const popup = document.createElement('div');
        popup.id = 'container-calculator-popup';
        popup.className = 'calculator-popup';
        popup.innerHTML = this.renderPopupHTML();
        document.body.appendChild(popup);
    }

    renderPopupHTML() {
        return `
            <div class="calculator-overlay">
                <div class="calculator-modal">
                    <div class="calculator-header">
                        <h2>
                            Container Estimation Calculator
                        </h2>
                        <button type="button" class="close-calculator">
                            ×
                        </button>
                    </div>
                    
                    <div class="calculator-content">
                        ${this.renderContainerSelector()}
                        ${this.renderProductForm()}
                        ${this.renderProductsList()}
                        ${this.renderResults()}
                    </div>
                    
                    <div class="calculator-footer">
                        <button type="button" class="btn-primary" id="use-calculation">Use This Calculation</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderModeToggle() {
        return `
            <div class="mode-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" id="advanced-mode" ${this.isAdvancedMode ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
                <span>Advanced Mode</span>
            </div>
        `;
    }

    renderContainerSelector() {
        // Only show container selector for FCL shipping
        if (this.mainFormContainerType !== 'fcl') {
            return ''; // Hide container selector for non-FCL
        }

        return `
            <div class="container-selector">
                <h3>Container Size</h3>
                <div class="container-options">
                    <label class="container-option ${this.selectedContainer === '20ft' ? 'selected' : ''}">
                        <input type="radio" name="container-type" value="20ft" ${this.selectedContainer === '20ft' ? 'checked' : ''}>
                        <div class="container-info">
                            <div class="container-name">20ft Container</div>
                        </div>
                    </label>
                    
                    <label class="container-option ${this.selectedContainer === '40ft' ? 'selected' : ''}">
                        <input type="radio" name="container-type" value="40ft" ${this.selectedContainer === '40ft' ? 'checked' : ''}>
                        <div class="container-info">
                            <div class="container-name">40ft Container</div>
                        </div>
                    </label>
                    
                    <label class="container-option ${this.selectedContainer === 'custom' ? 'selected' : ''}">
                        <input type="radio" name="container-type" value="custom" ${this.selectedContainer === 'custom' ? 'checked' : ''}>
                        <div class="container-info">
                            <div class="container-name">Other</div>
                            <div class="custom-container-inputs" style="display: ${this.selectedContainer === 'custom' ? 'block' : 'none'}; margin-top: 5px;">
                                <div class="custom-input-row">
                                    <input type="text" id="custom-container-description" placeholder="Other: e.g. Open top" value="${this.customContainerDescription || ''}" style="width: calc(100% - 10px); margin: 5px;">
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    renderProductForm() {
        return `
            <div class="product-form">
                <h3>Add Product</h3>
                <form id="add-product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Package Type *</label>
                            <input type="text" id="product-name" placeholder="e.g., Wooden Crates" required>
                        </div>
                        <div class="form-group">
                            <label>Quantity *</label>
                            <input type="number" id="product-quantity" placeholder="1" min="1" value="1" required>
                        </div>
                    </div>
                    
                    <div class="dimensions-section">
                        <h4>Dimensions per Unit</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Length *</label>
                                <input type="number" id="product-length" placeholder="0" min="0" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>Width *</label>
                                <input type="number" id="product-width" placeholder="0" min="0" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>Height *</label>
                                <input type="number" id="product-height" placeholder="0" min="0" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>Unit</label>
                                <select id="dimension-unit">
                                    <option value="cm">cm</option>
                                    <option value="m">m</option>
                                    <option value="mm">mm</option>
                                    <option value="inches">inches</option>
                                    <option value="feet">feet</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="weight-section">
                        <h4>Weight per Unit</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Weight *</label>
                                <input type="number" id="product-weight" placeholder="0" min="0" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>Unit</label>
                                <select id="weight-unit">
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="lbs">lbs</option>
                                    <option value="tons">tons</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    

                    
                    <button type="submit" class="btn-primary">
                        Add Product
                    </button>
                </form>
            </div>
        `;
    }

    renderAdvancedOptions() {
        return `
            <div class="advanced-options">
                <h4>Advanced Options</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stackable Height Limit (cm)</label>
                        <input type="number" id="stackable-height" placeholder="No limit" min="0">
                    </div>
                    <div class="form-group">
                        <label>Fragile (No Stacking)</label>
                        <input type="checkbox" id="is-fragile">
                    </div>
                </div>
            </div>
        `;
    }

    renderProductsList() {
        if (this.products.length === 0) {
            return `
                <div class="products-list">
                    <h3>Products List</h3>
                    <div class="empty-products">
                        <p>No products added yet</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="products-list">
                <h3>Products List (${this.products.length})</h3>
                <div class="products-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Dimensions (cm)</th>
                                <th>Unit Weight</th>
                                <th>Total Volume</th>
                                <th>Total Weight</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.products.map(product => `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.quantity}</td>
                                    <td>${product.lengthCm.toFixed(1)}×${product.widthCm.toFixed(1)}×${product.heightCm.toFixed(1)}</td>
                                    <td>${product.weightKg.toFixed(2)} kg</td>
                                    <td>${product.totalVolumeCbm.toFixed(3)} m³</td>
                                    <td>${product.totalWeightKg.toFixed(2)} kg</td>
                                    <td>
                                        <button type="button" class="btn-icon delete-product" data-id="${product.id}">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderResults() {
        if (this.products.length === 0) {
            return `
                <div class="calculation-results">
                    <h3>Calculation Results</h3>
                    <div class="empty-results">
                        <p>Add products to see calculations</p>
                    </div>
                </div>
            `;
        }

        const calculations = this.calculateContainerUtilisation();
        
        return `
            <div class="calculation-results">
                <h3>Calculation Results</h3>
                
                <div class="results-grid">
                    <div class="result-card">
                        <div class="result-header">
                            <span>Total Volume</span>
                        </div>
                        <div class="result-content">
                            <div class="result-row">
                                <span>Volume:</span>
                                <strong>${calculations.totalVolumeCbm.toFixed(3)} m³</strong>
                            </div>
                        </div>
                    </div>

                    <div class="result-card">
                        <div class="result-header">
                            <span>Total Weight</span>
                        </div>
                        <div class="result-content">
                            <div class="result-row">
                                <span>Weight:</span>
                                <strong>${calculations.totalWeightKg.toFixed(2)} kg</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderContainerStatus(calculations) {
        if (calculations.volumeUtilisation <= 100 && calculations.weightUtilisation <= 100) {
            return `
                <div class="status success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Fits in Container!</strong>
                    <p>Unused volume: ${(calculations.containerVolumeCbm - calculations.totalVolumeCbm).toFixed(3)} m³ 
                       (${(100 - calculations.volumeUtilisation).toFixed(1)}%)</p>
                </div>
            `;
        } else {
            const suggestions = [];
            if (calculations.volumeUtilisation > 100) {
                suggestions.push(`Need ${Math.ceil(calculations.volumeUtilisation / 100)} containers for volume`);
            }
            if (calculations.weightUtilisation > 100) {
                suggestions.push(`Need ${Math.ceil(calculations.weightUtilisation / 100)} containers for weight`);
            }
            
            return `
                <div class="status warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Container Exceeded!</strong>
                    <ul>
                        ${suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    renderWarnings(warnings) {
        return `
            <div class="warnings-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Warnings</h4>
                <ul class="warnings-list">
                    ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderOptimisationSuggestions(calculations) {
        const suggestions = [];
        
        if (calculations.volumeUtilisation < 60) {
            suggestions.push('Consider a smaller container to reduce costs');
        }
        
        if (calculations.chargeableWeightKg === calculations.volumetricWeightKg) {
            suggestions.push('Shipment is charged by volume (low density)');
        } else {
            suggestions.push('Shipment is charged by actual weight (high density)');
        }

        return `
            <div class="optimisation-section">
                <h4><i class="fas fa-lightbulb"></i> Optimisation Suggestions</h4>
                <ul class="suggestions-list">
                    ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'open-container-calculator') {
                // Get shipping method from main form
                const mainForm = window.easyFreightForm; // Assuming we'll make the main form accessible
                const shippingMethod = mainForm ? mainForm.formData.shipment_method : null;
                const containerType = mainForm ? mainForm.formData.container_type : null;
                this.openCalculator(shippingMethod, containerType);
            }
            
            // Close calculator - check for close button, its children, or overlay click
            if (e.target.classList.contains('close-calculator') || 
                e.target.closest('.close-calculator') || 
                (e.target.classList.contains('calculator-overlay') && !e.target.closest('.calculator-modal'))) {
                this.closeCalculator();
            }
            

            
            if (e.target.id === 'use-calculation') {
                this.useCalculation();
            }
            
            if (e.target.classList.contains('delete-product')) {
                const productId = parseInt(e.target.dataset.id);
                this.deleteProduct(productId);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.name === 'container-type') {
                this.selectedContainer = e.target.value;
                this.updateContainerDisplay();
                this.updateResults();
            }
            
            if (e.target.id.startsWith('custom-')) {
                this.updateCustomContainer();
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'add-product-form') {
                e.preventDefault();
                this.addProduct();
            }
        });

        // Handle Escape key to close calculator
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('container-calculator-popup').style.display === 'flex') {
                this.closeCalculator();
            }
        });
    }

    openCalculator(shippingMethod, containerType) {
        this.mainFormShippingMethod = shippingMethod;
        this.mainFormContainerType = containerType;
        const popup = document.getElementById('container-calculator-popup');
        if (popup) {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            // Update content based on shipping method
            this.updateCalculatorDisplay();
        }
    }

    closeCalculator() {
        const popup = document.getElementById('container-calculator-popup');
        if (popup) {
            popup.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    addProduct() {
        const formData = this.getProductFormData();
        if (!formData) return;

        const product = {
            id: this.nextProductId++,
            name: formData.name,
            quantity: formData.quantity,
            lengthCm: formData.length * this.unitConversions[formData.dimensionUnit],
            widthCm: formData.width * this.unitConversions[formData.dimensionUnit],
            heightCm: formData.height * this.unitConversions[formData.dimensionUnit],
            weightKg: formData.weight * this.weightConversions[formData.weightUnit],
            originalDimensions: {
                length: formData.length,
                width: formData.width,
                height: formData.height,
                unit: formData.dimensionUnit
            },
            originalWeight: {
                weight: formData.weight,
                unit: formData.weightUnit
            }
        };

        // Calculate derived values
        product.unitVolumeCbm = (product.lengthCm * product.widthCm * product.heightCm) / 1000000;
        product.totalVolumeCbm = product.unitVolumeCbm * product.quantity;
        product.totalWeightKg = product.weightKg * product.quantity;

        this.products.push(product);
        this.clearProductForm();
        this.updateCalculatorDisplay();
    }

    getProductFormData() {
        const name = document.getElementById('product-name').value.trim();
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const length = parseFloat(document.getElementById('product-length').value);
        const width = parseFloat(document.getElementById('product-width').value);
        const height = parseFloat(document.getElementById('product-height').value);
        const weight = parseFloat(document.getElementById('product-weight').value);
        const dimensionUnit = document.getElementById('dimension-unit').value;
        const weightUnit = document.getElementById('weight-unit').value;

        if (!name || !quantity || !length || !width || !height || !weight) {
            alert('Please fill in all required fields');
            return null;
        }

        return {
            name, quantity, length, width, height, weight, dimensionUnit, weightUnit
        };
    }

    clearProductForm() {
        document.getElementById('add-product-form').reset();
        document.getElementById('product-quantity').value = 1;
    }

    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.updateCalculatorDisplay();
    }

    clearAllProducts() {
        if (confirm('Are you sure you want to clear all products?')) {
            this.products = [];
            this.updateCalculatorDisplay();
        }
    }

    updateCalculatorDisplay() {
        const content = document.querySelector('.calculator-content');
        if (content) {
            content.innerHTML = `
                ${this.renderContainerSelector()}
                ${this.renderProductForm()}
                ${this.renderProductsList()}
                ${this.renderResults()}
            `;
        }
    }

    updateContainerDisplay() {
        const customInputs = document.querySelector('.custom-container-inputs');
        if (customInputs) {
            customInputs.style.display = this.selectedContainer === 'custom' ? 'block' : 'none';
        }
        
        // Update container option selection styling
        document.querySelectorAll('.container-option').forEach(option => {
            const input = option.querySelector('input[type="radio"]');
            if (input.checked) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    updateCustomContainer() {
        this.customContainer = {
            length: parseFloat(document.getElementById('custom-length').value) || 0,
            width: parseFloat(document.getElementById('custom-width').value) || 0,
            height: parseFloat(document.getElementById('custom-height').value) || 0,
            maxWeight: parseFloat(document.getElementById('custom-weight').value) || 0
        };
        this.updateResults();
    }

    updateResults() {
        const resultsContainer = document.querySelector('.calculation-results');
        if (resultsContainer) {
            resultsContainer.outerHTML = this.renderResults();
        }
    }

    calculateContainerUtilisation() {
        const container = this.selectedContainer === 'custom' ? this.customContainer : this.containers[this.selectedContainer];
        
        const totalVolumeCbm = this.products.reduce((sum, product) => sum + product.totalVolumeCbm, 0);
        const totalWeightKg = this.products.reduce((sum, product) => sum + product.totalWeightKg, 0);
        
        const containerVolumeCbm = (container.length * container.width * container.height) / 1000000;
        
        // Volumetric weight calculation (standard air freight formula: L×W×H in cm ÷ 5000)
        const volumetricWeightKg = (totalVolumeCbm * 1000000) / 5000;
        const chargeableWeightKg = Math.max(totalWeightKg, volumetricWeightKg);
        
        const volumeUtilisation = (totalVolumeCbm / containerVolumeCbm) * 100;
        const weightUtilisation = (totalWeightKg / container.maxWeight) * 100;
        
        const warnings = [];
        if (volumeUtilisation > 100) {
            warnings.push(`Volume exceeds container capacity by ${(volumeUtilisation - 100).toFixed(1)}%`);
        }
        if (weightUtilisation > 100) {
            warnings.push(`Weight exceeds container limit by ${(weightUtilisation - 100).toFixed(1)}%`);
        }
        if (totalVolumeCbm === 0) {
            warnings.push('No products added for calculation');
        }

        return {
            totalVolumeCbm,
            totalWeightKg,
            containerVolumeCbm,
            volumetricWeightKg,
            chargeableWeightKg,
            volumeUtilisation,
            weightUtilisation,
            warnings,
            container
        };
    }

    exportCSV() {
        if (this.products.length === 0) {
            alert('No products to export');
            return;
        }

        const calculations = this.calculateContainerUtilisation();
        const container = calculations.container;
        
        let csv = 'Product Name,Quantity,Length (cm),Width (cm),Height (cm),Weight per Unit (kg),Total Volume (m³),Total Weight (kg)\n';
        
        this.products.forEach(product => {
            csv += `"${product.name}",${product.quantity},${product.lengthCm.toFixed(1)},${product.widthCm.toFixed(1)},${product.heightCm.toFixed(1)},${product.weightKg.toFixed(2)},${product.totalVolumeCbm.toFixed(3)},${product.totalWeightKg.toFixed(2)}\n`;
        });
        
        csv += '\nSummary:\n';
        csv += `Container Type,"${container.name || 'Custom'}"\n`;
        csv += `Container Capacity,"${calculations.containerVolumeCbm.toFixed(3)} m³"\n`;
        csv += `Total Volume,"${calculations.totalVolumeCbm.toFixed(3)} m³"\n`;
        csv += `Total Weight,"${calculations.totalWeightKg.toFixed(2)} kg"\n`;
        csv += `Volumetric Weight,"${calculations.volumetricWeightKg.toFixed(2)} kg"\n`;
        csv += `Chargeable Weight,"${calculations.chargeableWeightKg.toFixed(2)} kg"\n`;
        csv += `Volume Utilisation,"${calculations.volumeUtilisation.toFixed(1)}%"\n`;
        csv += `Weight Utilisation,"${calculations.weightUtilisation.toFixed(1)}%"\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `container-calculation-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    printResults() {
        if (this.products.length === 0) {
            alert('No results to print');
            return;
        }

        const printContent = this.generatePrintContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintContent() {
        const calculations = this.calculateContainerUtilisation();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Calculation Results</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1, h2 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
                    .warning { color: #d63384; }
                    .success { color: #198754; }
                </style>
            </head>
            <body>
                <h1>Calculation Results</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                
                <h2>Products</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Dimensions (cm)</th>
                            <th>Unit Weight (kg)</th>
                            <th>Total Volume (m³)</th>
                            <th>Total Weight (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.quantity}</td>
                                <td>${product.lengthCm.toFixed(1)}×${product.widthCm.toFixed(1)}×${product.heightCm.toFixed(1)}</td>
                                <td>${product.weightKg.toFixed(2)}</td>
                                <td>${product.totalVolumeCbm.toFixed(3)}</td>
                                <td>${product.totalWeightKg.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="summary">
                    <h2>Summary</h2>
                    <p><strong>Container:</strong> ${calculations.container.name || 'Custom'} (${calculations.containerVolumeCbm.toFixed(3)} m³)</p>
                    <p><strong>Total Volume:</strong> ${calculations.totalVolumeCbm.toFixed(3)} m³</p>
                    <p><strong>Total Weight:</strong> ${calculations.totalWeightKg.toFixed(2)} kg</p>
                    <p><strong>Volumetric Weight:</strong> ${calculations.volumetricWeightKg.toFixed(2)} kg</p>
                    <p><strong>Chargeable Weight:</strong> ${calculations.chargeableWeightKg.toFixed(2)} kg</p>
                    <p><strong>Volume Utilisation:</strong> <span class="${calculations.volumeUtilisation > 100 ? 'warning' : 'success'}">${calculations.volumeUtilisation.toFixed(1)}%</span></p>
                    <p><strong>Weight Utilisation:</strong> <span class="${calculations.weightUtilisation > 100 ? 'warning' : 'success'}">${calculations.weightUtilisation.toFixed(1)}%</span></p>
                </div>
                
                ${calculations.warnings.length > 0 ? `
                    <h2>Warnings</h2>
                    <ul class="warning">
                        ${calculations.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                ` : ''}
            </body>
            </html>
        `;
    }

    useCalculation() {
        if (this.products.length === 0) {
            alert('No products to use for calculation');
            return;
        }

        const calculations = this.calculateContainerUtilisation();
        const packingInfo = this.generatePackingInfoText(calculations);
        
        // Update the main form's packing information field
        const packingTextarea = document.getElementById('packing_info_combined');
        if (packingTextarea) {
            packingTextarea.value = packingInfo;
            packingTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        this.closeCalculator();
    }

    generatePackingInfoText(calculations) {
        let text = `Calculation Results:\n\n`;
        
        // Products summary
        text += `Products (${this.products.length} types):\n`;
        this.products.forEach(product => {
            text += `• ${product.name}: ${product.quantity} units @ ${product.lengthCm.toFixed(1)}×${product.widthCm.toFixed(1)}×${product.heightCm.toFixed(1)}cm, ${product.weightKg.toFixed(2)}kg each\n`;
        });
        
        text += `\nTotals:\n`;
        text += `• Total Volume: ${calculations.totalVolumeCbm.toFixed(3)} m³\n`;
        text += `• Total Weight: ${calculations.totalWeightKg.toFixed(2)} kg\n`;

        return text;
    }
}

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContainerCalculator().init();
    });
} else {
    new ContainerCalculator().init();
}