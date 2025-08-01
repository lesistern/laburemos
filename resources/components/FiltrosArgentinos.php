<?php
/**
 * FiltrosArgentinos - Sistema de filtros específico para Argentina
 * 
 * Filtros únicos:
 * - Ubicación argentina (CABA, GBA, Interior)
 * - Monotributo verificado
 * - Acepta videollamadas
 * - Cuotas MercadoPago disponibles
 * - Experiencia local en años
 * - Horario Argentina
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-20
 */

class FiltrosArgentinos {
    
    private $currentFilters;
    private $resultCount;
    
    // Configuración de filtros argentinos
    private const UBICACIONES_ARGENTINA = [
        'CABA' => 'Ciudad Autónoma de Buenos Aires',
        'GBA' => 'Gran Buenos Aires',
        'Buenos Aires' => 'Provincia de Buenos Aires',
        'Córdoba' => 'Córdoba',
        'Rosario' => 'Rosario',
        'Mendoza' => 'Mendoza',
        'Tucumán' => 'Tucumán',
        'La Plata' => 'La Plata',
        'Mar del Plata' => 'Mar del Plata',
        'Interior' => 'Interior del país'
    ];
    
    private const RANGOS_PRECIO_ARS = [
        '0-5000' => 'Hasta AR$ 5.000',
        '5000-15000' => 'AR$ 5.000 - 15.000',
        '15000-30000' => 'AR$ 15.000 - 30.000',
        '30000-50000' => 'AR$ 30.000 - 50.000',
        '50000-100000' => 'AR$ 50.000 - 100.000',
        '100000+' => 'Más de AR$ 100.000'
    ];
    
    private const TIEMPOS_ENTREGA = [
        '1' => '24 horas',
        '2-3' => '2-3 días',
        '4-7' => 'Hasta 1 semana',
        '8-14' => 'Hasta 2 semanas',
        '15-30' => 'Hasta 1 mes',
        '30+' => 'Más de 1 mes'
    ];
    
    public function __construct($filters = [], $resultCount = 0) {
        $this->currentFilters = $filters;
        $this->resultCount = $resultCount;
    }
    
    /**
     * Renderizar sistema completo de filtros
     */
    public function render() {
        return "
        <div class='filtros-argentinos-container'>
            <div class='filtros-header'>
                <h3 class='filtros-title'>
                    <i class='icon-filter'></i>
                    Filtrar servicios
                </h3>
                <div class='filtros-actions'>
                    <button class='btn-reset-filters' onclick='filtrosManager.resetFilters()'>
                        <i class='icon-x'></i>
                        Limpiar filtros
                    </button>
                    <div class='results-count'>
                        <span class='count-number'>{$this->resultCount}</span>
                        <span class='count-label'>servicios encontrados</span>
                    </div>
                </div>
            </div>
            
            <div class='filtros-content'>
                {$this->renderQuickFilters()}
                {$this->renderMainFilters()}
                {$this->renderAdvancedFilters()}
            </div>
            
            <div class='filtros-footer'>
                {$this->renderApplyButton()}
            </div>
        </div>";
    }
    
    /**
     * Filtros rápidos más comunes
     */
    private function renderQuickFilters() {
        return "
        <div class='quick-filters-section'>
            <h4 class='section-title'>Filtros rápidos</h4>
            <div class='quick-filters-grid'>
                <button class='quick-filter-btn {$this->getActiveClass('monotributo_verified')}' 
                        data-filter='monotributo_verified' data-value='true'>
                    <i class='icon-check-circle'></i>
                    <span>Monotributista verificado</span>
                </button>
                
                <button class='quick-filter-btn {$this->getActiveClass('videollamada_available')}' 
                        data-filter='videollamada_available' data-value='true'>
                    <i class='icon-video'></i>
                    <span>Acepta videollamadas</span>
                </button>
                
                <button class='quick-filter-btn {$this->getActiveClass('cuotas_disponibles')}' 
                        data-filter='cuotas_disponibles' data-value='true'>
                    <i class='icon-credit-card'></i>
                    <span>Cuotas sin interés</span>
                </button>
                
                <button class='quick-filter-btn {$this->getActiveClass('talento_argentino_badge')}' 
                        data-filter='talento_argentino_badge' data-value='true'>
                    <i class='icon-star'></i>
                    <span>Talento Argentino</span>
                </button>
                
                <button class='quick-filter-btn {$this->getActiveClass('ubicacion', 'CABA')}' 
                        data-filter='ubicacion' data-value='CABA'>
                    <i class='icon-map-pin'></i>
                    <span>En CABA</span>
                </button>
                
                <button class='quick-filter-btn {$this->getActiveClass('entrega_rapida')}' 
                        data-filter='delivery_days' data-value='1-3'>
                    <i class='icon-clock'></i>
                    <span>Entrega rápida</span>
                </button>
            </div>
        </div>";
    }
    
    /**
     * Filtros principales detallados
     */
    private function renderMainFilters() {
        return "
        <div class='main-filters-section'>
            <div class='filters-grid'>
                
                {$this->renderPriceFilter()}
                {$this->renderLocationFilter()}
                {$this->renderDeliveryTimeFilter()}
                {$this->renderServiceTypeFilter()}
                
            </div>
        </div>";
    }
    
    /**
     * Filtro de precio en pesos argentinos
     */
    private function renderPriceFilter() {
        $selectedRange = $this->currentFilters['precio_rango'] ?? '';
        
        $options = '';
        foreach (self::RANGOS_PRECIO_ARS as $value => $label) {
            $selected = $value === $selectedRange ? 'selected' : '';
            $options .= "<option value='{$value}' {$selected}>{$label}</option>";
        }
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-dollar-sign'></i>
                Rango de precio
            </label>
            <select class='filter-select' name='precio_rango' onchange='filtrosManager.updateFilter(this)'>
                <option value=''>Cualquier precio</option>
                {$options}
            </select>
            
            <div class='price-input-range'>
                <div class='input-group'>
                    <span class='input-prefix'>AR$</span>
                    <input type='number' 
                           class='price-input' 
                           name='precio_min' 
                           placeholder='Mínimo'
                           value='{$this->currentFilters['precio_min'] ?? ''}'
                           onchange='filtrosManager.updateFilter(this)'>
                </div>
                <span class='range-separator'>-</span>
                <div class='input-group'>
                    <span class='input-prefix'>AR$</span>
                    <input type='number' 
                           class='price-input' 
                           name='precio_max' 
                           placeholder='Máximo'
                           value='{$this->currentFilters['precio_max'] ?? ''}'
                           onchange='filtrosManager.updateFilter(this)'>
                </div>
            </div>
            
            <div class='price-suggestions'>
                <small class='suggestion-text'>Precios promedio en Argentina:</small>
                <div class='price-chips'>
                    <button class='price-chip' onclick='filtrosManager.setPrice(0, 10000)'>
                        Económico (hasta AR$ 10.000)
                    </button>
                    <button class='price-chip' onclick='filtrosManager.setPrice(10000, 35000)'>
                        Medio (AR$ 10.000 - 35.000)
                    </button>
                    <button class='price-chip' onclick='filtrosManager.setPrice(35000, null)'>
                        Premium (desde AR$ 35.000)
                    </button>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Filtro de ubicación argentina
     */
    private function renderLocationFilter() {
        $selectedLocation = $this->currentFilters['ubicacion'] ?? '';
        
        $options = '';
        foreach (self::UBICACIONES_ARGENTINA as $value => $label) {
            $selected = $value === $selectedLocation ? 'selected' : '';
            $options .= "<option value='{$value}' {$selected}>{$label}</option>";
        }
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-map-pin'></i>
                Ubicación en Argentina
            </label>
            <select class='filter-select' name='ubicacion' onchange='filtrosManager.updateFilter(this)'>
                <option value=''>Cualquier ubicación</option>
                {$options}
            </select>
            
            <div class='location-info'>
                <small class='info-text'>
                    <i class='icon-info'></i>
                    Los freelancers locales pueden coordinar reuniones presenciales
                </small>
            </div>
        </div>";
    }
    
    /**
     * Filtro de tiempo de entrega
     */
    private function renderDeliveryTimeFilter() {
        $selectedTime = $this->currentFilters['tiempo_entrega'] ?? '';
        
        $options = '';
        foreach (self::TIEMPOS_ENTREGA as $value => $label) {
            $selected = $value === $selectedTime ? 'selected' : '';
            $options .= "<option value='{$value}' {$selected}>{$label}</option>";
        }
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-clock'></i>
                Tiempo de entrega
            </label>
            <select class='filter-select' name='tiempo_entrega' onchange='filtrosManager.updateFilter(this)'>
                <option value=''>Cualquier tiempo</option>
                {$options}
            </select>
            
            <div class='delivery-info'>
                <small class='info-text'>
                    <i class='icon-truck'></i>
                    Tiempo promedio en días hábiles
                </small>
            </div>
        </div>";
    }
    
    /**
     * Filtro de tipo de servicio
     */
    private function renderServiceTypeFilter() {
        $selectedType = $this->currentFilters['service_type'] ?? '';
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-layers'></i>
                Tipo de servicio
            </label>
            <div class='radio-group'>
                <label class='radio-option'>
                    <input type='radio' 
                           name='service_type' 
                           value='' 
                           {$this->getChecked('service_type', '')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='radio-custom'></span>
                    <span class='radio-label'>Todos</span>
                </label>
                
                <label class='radio-option'>
                    <input type='radio' 
                           name='service_type' 
                           value='gig' 
                           {$this->getChecked('service_type', 'gig')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='radio-custom'></span>
                    <span class='radio-label'>Servicio estándar</span>
                    <small class='radio-description'>Tareas predefinidas con precio fijo</small>
                </label>
                
                <label class='radio-option'>
                    <input type='radio' 
                           name='service_type' 
                           value='custom' 
                           {$this->getChecked('service_type', 'custom')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='radio-custom'></span>
                    <span class='radio-label'>Proyecto personalizado</span>
                    <small class='radio-description'>Cotización específica para tu proyecto</small>
                </label>
                
                <label class='radio-option'>
                    <input type='radio' 
                           name='service_type' 
                           value='hybrid' 
                           {$this->getChecked('service_type', 'hybrid')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='radio-custom'></span>
                    <span class='radio-label'>Híbrido</span>
                    <small class='radio-description'>Base estándar + personalización</small>
                </label>
            </div>
        </div>";
    }
    
    /**
     * Filtros avanzados (collapsed por defecto)
     */
    private function renderAdvancedFilters() {
        $isExpanded = !empty(array_intersect_key($this->currentFilters, [
            'rating_min' => true,
            'experiencia_local' => true,
            'horario_argentina' => true,
            'idiomas' => true
        ]));
        
        $expandedClass = $isExpanded ? 'expanded' : '';
        
        return "
        <div class='advanced-filters-section {$expandedClass}'>
            <button class='advanced-toggle' onclick='filtrosManager.toggleAdvanced()'>
                <span class='toggle-text'>Filtros avanzados</span>
                <i class='icon-chevron-down toggle-icon'></i>
            </button>
            
            <div class='advanced-filters-content'>
                <div class='advanced-filters-grid'>
                    
                    {$this->renderRatingFilter()}
                    {$this->renderExperienceFilter()}
                    {$this->renderScheduleFilter()}
                    {$this->renderLanguageFilter()}
                    {$this->renderPaymentFilter()}
                    
                </div>
            </div>
        </div>";
    }
    
    /**
     * Filtro de rating mínimo
     */
    private function renderRatingFilter() {
        $selectedRating = $this->currentFilters['rating_min'] ?? '';
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-star'></i>
                Calificación mínima
            </label>
            <div class='rating-filter'>
                <div class='rating-options'>
                    <button class='rating-btn {$this->getActiveClass('rating_min', '4.5')}' 
                            data-filter='rating_min' data-value='4.5'>
                        {$this->renderStars(4.5)} y más
                    </button>
                    <button class='rating-btn {$this->getActiveClass('rating_min', '4')}' 
                            data-filter='rating_min' data-value='4'>
                        {$this->renderStars(4)} y más
                    </button>
                    <button class='rating-btn {$this->getActiveClass('rating_min', '3.5')}' 
                            data-filter='rating_min' data-value='3.5'>
                        {$this->renderStars(3.5)} y más
                    </button>
                </div>
            </div>
        </div>";
    }
    
    /**
     * Filtro de experiencia local
     */
    private function renderExperienceFilter() {
        $selectedExp = $this->currentFilters['experiencia_local'] ?? '';
        
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-award'></i>
                Experiencia en Argentina
            </label>
            <select class='filter-select' name='experiencia_local' onchange='filtrosManager.updateFilter(this)'>
                <option value=''>Cualquier experiencia</option>
                <option value='1+' {$this->getSelected('experiencia_local', '1+')}>1+ años</option>
                <option value='3+' {$this->getSelected('experiencia_local', '3+')}>3+ años</option>
                <option value='5+' {$this->getSelected('experiencia_local', '5+')}>5+ años</option>
                <option value='10+' {$this->getSelected('experiencia_local', '10+')}>10+ años</option>
            </select>
        </div>";
    }
    
    /**
     * Filtro de horario argentina
     */
    private function renderScheduleFilter() {
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-clock'></i>
                Horario de trabajo
            </label>
            <div class='checkbox-group'>
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='horario_argentina' 
                           value='true'
                           {$this->getChecked('horario_argentina', 'true')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Horario Argentina (UTC-3)</span>
                    <small class='checkbox-description'>Trabaja en zona horaria argentina</small>
                </label>
                
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='disponible_fines_semana' 
                           value='true'
                           {$this->getChecked('disponible_fines_semana', 'true')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Disponible fines de semana</span>
                </label>
            </div>
        </div>";
    }
    
    /**
     * Filtro de idiomas
     */
    private function renderLanguageFilter() {
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-globe'></i>
                Idiomas
            </label>
            <div class='checkbox-group'>
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='idiomas[]' 
                           value='español_nativo'
                           {$this->getChecked('idiomas', 'español_nativo')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Español nativo</span>
                </label>
                
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='idiomas[]' 
                           value='ingles_fluido'
                           {$this->getChecked('idiomas', 'ingles_fluido')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Inglés fluido</span>
                </label>
                
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='idiomas[]' 
                           value='portugues'
                           {$this->getChecked('idiomas', 'portugues')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Portugués</span>
                </label>
            </div>
        </div>";
    }
    
    /**
     * Filtro de métodos de pago
     */
    private function renderPaymentFilter() {
        return "
        <div class='filter-group'>
            <label class='filter-label'>
                <i class='icon-credit-card'></i>
                Métodos de pago
            </label>
            <div class='checkbox-group'>
                <label class='checkbox-option popular'>
                    <input type='checkbox' 
                           name='mercadopago_cuotas' 
                           value='true'
                           {$this->getChecked('mercadopago_cuotas', 'true')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>
                        Cuotas sin interés
                        <span class='popular-badge'>Popular</span>
                    </span>
                    <small class='checkbox-description'>Hasta 12 cuotas con MercadoPago</small>
                </label>
                
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='acepta_transferencia' 
                           value='true'
                           {$this->getChecked('acepta_transferencia', 'true')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Transferencia bancaria</span>
                </label>
                
                <label class='checkbox-option'>
                    <input type='checkbox' 
                           name='acepta_cripto' 
                           value='true'
                           {$this->getChecked('acepta_cripto', 'true')}
                           onchange='filtrosManager.updateFilter(this)'>
                    <span class='checkbox-custom'></span>
                    <span class='checkbox-label'>Criptomonedas</span>
                </label>
            </div>
        </div>";
    }
    
    /**
     * Botón de aplicar filtros
     */
    private function renderApplyButton() {
        $hasFilters = !empty(array_filter($this->currentFilters));
        $buttonClass = $hasFilters ? 'has-filters' : '';
        
        return "
        <div class='apply-filters-container'>
            <button class='btn-apply-filters {$buttonClass}' onclick='filtrosManager.applyFilters()'>
                <i class='icon-search'></i>
                <span class='apply-text'>Aplicar filtros</span>
                <span class='filters-count'>" . ($hasFilters ? count(array_filter($this->currentFilters)) : '') . "</span>
            </button>
            
            <div class='filters-summary'>
                {$this->renderActiveFilters()}
            </div>
        </div>";
    }
    
    /**
     * Resumen de filtros activos
     */
    private function renderActiveFilters() {
        if (empty($this->currentFilters)) {
            return '';
        }
        
        $activeFilters = '';
        foreach ($this->currentFilters as $key => $value) {
            if (empty($value)) continue;
            
            $label = $this->getFilterLabel($key, $value);
            $activeFilters .= "
            <span class='active-filter-tag'>
                {$label}
                <button class='remove-filter' 
                        onclick='filtrosManager.removeFilter(\"{$key}\")'>
                    <i class='icon-x'></i>
                </button>
            </span>";
        }
        
        return $activeFilters ? "
        <div class='active-filters'>
            <span class='active-filters-label'>Filtros activos:</span>
            {$activeFilters}
        </div>" : '';
    }
    
    // Métodos de utilidad
    
    private function getActiveClass($filter, $value = 'true') {
        return isset($this->currentFilters[$filter]) && 
               $this->currentFilters[$filter] === $value ? 'active' : '';
    }
    
    private function getChecked($filter, $value) {
        if ($filter === 'idiomas') {
            $idiomas = $this->currentFilters['idiomas'] ?? [];
            return in_array($value, (array)$idiomas) ? 'checked' : '';
        }
        
        return isset($this->currentFilters[$filter]) && 
               $this->currentFilters[$filter] === $value ? 'checked' : '';
    }
    
    private function getSelected($filter, $value) {
        return isset($this->currentFilters[$filter]) && 
               $this->currentFilters[$filter] === $value ? 'selected' : '';
    }
    
    private function renderStars($rating) {
        $stars = '';
        for ($i = 1; $i <= 5; $i++) {
            if ($i <= $rating) {
                $stars .= '<i class="star star-full"></i>';
            } elseif ($i - 0.5 <= $rating) {
                $stars .= '<i class="star star-half"></i>';
            } else {
                $stars .= '<i class="star star-empty"></i>';
            }
        }
        return $stars;
    }
    
    private function getFilterLabel($key, $value) {
        $labels = [
            'monotributo_verified' => 'Monotributista verificado',
            'videollamada_available' => 'Acepta videollamadas',
            'cuotas_disponibles' => 'Cuotas sin interés',
            'talento_argentino_badge' => 'Talento Argentino',
            'ubicacion' => self::UBICACIONES_ARGENTINA[$value] ?? $value,
            'precio_rango' => self::RANGOS_PRECIO_ARS[$value] ?? $value,
            'tiempo_entrega' => self::TIEMPOS_ENTREGA[$value] ?? $value,
            'service_type' => ucfirst($value),
            'rating_min' => "Rating {$value}+",
            'experiencia_local' => "Experiencia {$value}",
            'horario_argentina' => 'Horario Argentina'
        ];
        
        return $labels[$key] ?? $value;
    }
    
    /**
     * Método estático para uso rápido
     */
    public static function quickRender($filters = [], $resultCount = 0) {
        $instance = new self($filters, $resultCount);
        return $instance->render();
    }
}