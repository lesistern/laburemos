<?php
/**
 * LaburAR Argentine Culture Manager
 * 
 * Handles Argentine-specific cultural optimizations
 * Including timezone, language, business context, and local advantages
 * 
 * @author LaburAR Team
 * @version 1.0
 * @since 2025-07-21
 */

class ArgentineCultureManager {
    
    private $timeZone = 'America/Argentina/Buenos_Aires';
    private $locale = 'es_AR';
    private $currency = 'ARS';
    
    /**
     * Get Argentine business hours context
     */
    public function getBusinessHoursContext(): array {
        $timezone = new DateTimeZone($this->timeZone);
        $now = new DateTime('now', $timezone);
        
        return [
            'current_time' => $now->format('H:i'),
            'current_date' => $now->format('d/m/Y'),
            'current_day_name' => $this->getSpanishDayName($now->format('N')),
            'is_business_hours' => $this->isBusinessHours($now),
            'is_weekend' => $this->isWeekend($now),
            'next_business_day' => $this->getNextBusinessDay($now),
            'timezone_display' => 'Hora Argentina (UTC-3)',
            'business_hours' => '09:00 - 18:00 hs',
            'weekend_message' => 'Los freelancers argentinos suelen responder durante días hábiles',
            'business_status' => $this->getBusinessStatus($now),
            'response_expectation' => $this->getResponseExpectation($now)
        ];
    }
    
    /**
     * Format date/time for Argentine users
     */
    public function formatArgentineDateTime(DateTime $dateTime): array {
        $dateTime->setTimezone(new DateTimeZone($this->timeZone));
        
        return [
            'date' => $dateTime->format('d/m/Y'),
            'time' => $dateTime->format('H:i') . ' hs',
            'datetime' => $dateTime->format('d/m/Y H:i') . ' hs',
            'relative' => $this->getRelativeTime($dateTime),
            'timezone' => 'Hora Argentina',
            'day_name' => $this->getSpanishDayName($dateTime->format('N')),
            'month_name' => $this->getSpanishMonthName($dateTime->format('n'))
        ];
    }
    
    /**
     * Get Argentine-specific messaging and expressions
     */
    public function getLocalizedMessages(): array {
        return [
            'greetings' => [
                'morning' => '¡Buen día!',
                'afternoon' => '¡Buenas tardes!',
                'evening' => '¡Buenas noches!',
                'general' => '¡Hola!',
                'informal' => '¡Che, qué tal!',
                'business' => 'Buenos días/tardes'
            ],
            'politeness' => [
                'please' => 'por favor',
                'thank_you' => 'gracias',
                'you_welcome' => 'de nada',
                'excuse_me' => 'disculpá',
                'sorry' => 'perdón',
                'pardon' => 'cómo',
                'bless_you' => 'salud'
            ],
            'business' => [
                'quotation' => 'cotización',
                'budget' => 'presupuesto',
                'invoice' => 'factura',
                'receipt' => 'comprobante',
                'payment' => 'pago',
                'delivery' => 'entrega',
                'deadline' => 'fecha límite',
                'advance' => 'anticipo',
                'balance' => 'saldo',
                'tax' => 'impuesto'
            ],
            'encouragement' => [
                'great_work' => '¡Excelente trabajo!',
                'well_done' => '¡Muy bien hecho!',
                'professional' => '¡Muy profesional!',
                'recommended' => '¡Te recomiendo!',
                'quality' => '¡Excelente calidad!',
                'genius' => '¡Sos un genio!',
                'amazing' => '¡Increíble!',
                'perfect' => '¡Perfecto!'
            ],
            'argentine_expressions' => [
                'agreement' => 'Dale',
                'surprise' => '¡No te puedo creer!',
                'emphasis' => 'En serio',
                'doubt' => '¿En serio?',
                'approval' => 'Está bárbaro',
                'excellent' => 'Está buenísimo',
                'problem' => 'Hay un problema',
                'no_problem' => 'No hay drama'
            ]
        ];
    }
    
    /**
     * Get Argentine location context
     */
    public function getArgentineLocations(): array {
        return [
            'provinces' => [
                'CABA' => 'Ciudad Autónoma de Buenos Aires',
                'BA' => 'Buenos Aires',
                'CAT' => 'Catamarca',
                'CHA' => 'Chaco',
                'CHU' => 'Chubut',
                'COR' => 'Córdoba',
                'CRR' => 'Corrientes',
                'ER' => 'Entre Ríos',
                'FOR' => 'Formosa',
                'JUJ' => 'Jujuy',
                'LP' => 'La Pampa',
                'LR' => 'La Rioja',
                'MEN' => 'Mendoza',
                'MIS' => 'Misiones',
                'NEU' => 'Neuquén',
                'RN' => 'Río Negro',
                'SAL' => 'Salta',
                'SJ' => 'San Juan',
                'SL' => 'San Luis',
                'SC' => 'Santa Cruz',
                'SF' => 'Santa Fe',
                'SE' => 'Santiago del Estero',
                'TF' => 'Tierra del Fuego',
                'TUC' => 'Tucumán'
            ],
            'major_cities' => [
                'Ciudad Autónoma de Buenos Aires' => 'CABA',
                'Córdoba' => 'COR',
                'Rosario' => 'SF',
                'Mendoza' => 'MEN',
                'San Miguel de Tucumán' => 'TUC',
                'La Plata' => 'BA',
                'Mar del Plata' => 'BA',
                'Salta' => 'SAL',
                'Neuquén' => 'NEU',
                'Resistencia' => 'CHA',
                'Corrientes' => 'CRR',
                'Santa Fe' => 'SF',
                'Paraná' => 'ER',
                'Posadas' => 'MIS',
                'San Juan' => 'SJ',
                'San Luis' => 'SL',
                'Río Gallegos' => 'SC',
                'Ushuaia' => 'TF'
            ],
            'regions' => [
                'GBA' => 'Gran Buenos Aires',
                'NOA' => 'Noroeste Argentino',
                'NEA' => 'Noreste Argentino',
                'CUYO' => 'Región de Cuyo',
                'CENTRO' => 'Región Centro',
                'PATAGONIA' => 'Patagonia'
            ],
            'timezone_cities' => [
                'Buenos Aires' => 'UTC-3',
                'Córdoba' => 'UTC-3',
                'Mendoza' => 'UTC-3',
                'Tucumán' => 'UTC-3',
                'Salta' => 'UTC-3',
                'Neuquén' => 'UTC-3'
            ]
        ];
    }
    
    /**
     * Get Argentine professional context
     */
    public function getProfessionalContext(): array {
        return [
            'education_levels' => [
                'primario' => 'Primario completo',
                'secundario' => 'Secundario completo',
                'terciario' => 'Terciario/Técnico',
                'universitario_incompleto' => 'Universitario incompleto',
                'universitario' => 'Universitario completo',
                'posgrado' => 'Posgrado',
                'especializacion' => 'Especialización',
                'master' => 'Maestría',
                'doctorado' => 'Doctorado'
            ],
            'professional_titles' => [
                'lic' => 'Licenciado/a',
                'ing' => 'Ingeniero/a',
                'arq' => 'Arquitecto/a',
                'dr' => 'Doctor/a',
                'prof' => 'Profesor/a',
                'tec' => 'Técnico/a',
                'dis' => 'Diseñador/a',
                'cont' => 'Contador/a',
                'abog' => 'Abogado/a',
                'psic' => 'Psicólogo/a',
                'med' => 'Médico/a',
                'farm' => 'Farmacéutico/a'
            ],
            'business_types' => [
                'monotributista' => 'Monotributista',
                'responsable_inscripto' => 'Responsable Inscripto',
                'exento' => 'Exento',
                'consumidor_final' => 'Consumidor Final',
                'sujeto_no_categorizado' => 'Sujeto No Categorizado'
            ],
            'payment_terms' => [
                'contado' => 'Contado',
                'cuenta_corriente' => 'Cuenta corriente',
                '30_dias' => '30 días',
                '60_dias' => '60 días',
                '90_dias' => '90 días',
                'anticipo' => 'Anticipo + saldo',
                'anticipo_50' => '50% anticipo, 50% entrega',
                'mensual' => 'Pago mensual'
            ],
            'work_modalities' => [
                'presencial' => 'Presencial',
                'remoto' => 'Remoto',
                'hibrido' => 'Híbrido',
                'freelance' => 'Freelance',
                'part_time' => 'Part-time',
                'full_time' => 'Full-time',
                'por_proyecto' => 'Por proyecto'
            ]
        ];
    }
    
    /**
     * Get competitive advantages over international platforms
     */
    public function getCompetitiveAdvantages(): array {
        return [
            'timezone' => [
                'title' => 'Mismo horario',
                'description' => 'Comunicación en tiempo real durante horario laboral argentino',
                'icon' => '🕐',
                'benefit' => 'Sin esperas por diferencia horaria',
                'detail' => 'Trabajamos de 9 a 18hs como vos',
                'comparison' => 'Plataformas internacionales: diferencias horarias complicadas'
            ],
            'language' => [
                'title' => 'Comunicación directa',
                'description' => 'Sin barreras idiomáticas, entendemos tu negocio local',
                'icon' => '💬',
                'benefit' => 'Comunicación clara y efectiva',
                'detail' => 'Hablamos tu mismo idioma y cultura',
                'comparison' => 'Plataformas internacionales: barreras idiomáticas'
            ],
            'legal' => [
                'title' => 'Cumplimiento legal',
                'description' => 'Freelancers verificados con CUIT y cumplimiento fiscal',
                'icon' => '📋',
                'benefit' => 'Tranquilidad legal total',
                'detail' => 'Todos los freelancers están en regla con AFIP',
                'comparison' => 'Plataformas internacionales: sin verificaciones locales'
            ],
            'professional' => [
                'title' => 'Profesionales titulados',
                'description' => 'Verificamos títulos universitarios y matrículas profesionales',
                'icon' => '🏛️',
                'benefit' => 'Calidad profesional garantizada',
                'detail' => 'Títulos verificados con universidades argentinas',
                'comparison' => 'Plataformas internacionales: sin validación educativa local'
            ],
            'payment' => [
                'title' => 'Pagos locales',
                'description' => 'MercadoPago, transferencias y todos los métodos argentinos',
                'icon' => '💳',
                'benefit' => 'Pagá como más te convenga',
                'detail' => '12 cuotas sin interés con MercadoPago',
                'comparison' => 'Plataformas internacionales: métodos de pago limitados'
            ],
            'market' => [
                'title' => 'Conocimiento local',
                'description' => 'Entendemos el mercado, cultura y necesidades argentinas',
                'icon' => '🇦🇷',
                'benefit' => 'Soluciones pensadas para Argentina',
                'detail' => 'Freelancers que conocen el mercado local',
                'comparison' => 'Plataformas internacionales: desconocimiento del mercado local'
            ],
            'support' => [
                'title' => 'Soporte en español',
                'description' => 'Atención al cliente en horario argentino y en español',
                'icon' => '🎧',
                'benefit' => 'Ayuda cuando la necesités',
                'detail' => 'Soporte de 9 a 18hs hora argentina',
                'comparison' => 'Plataformas internacionales: soporte limitado en español'
            ],
            'prices' => [
                'title' => 'Precios en pesos',
                'description' => 'Precios claros en pesos argentinos, sin conversiones',
                'icon' => '💰',
                'benefit' => 'Sabés exactamente cuánto pagás',
                'detail' => 'Sin sorpresas por fluctuación del dólar',
                'comparison' => 'Plataformas internacionales: precios en moneda extranjera'
            ]
        ];
    }
    
    /**
     * Generate contextual greeting based on time and day
     */
    public function getContextualGreeting(): string {
        $timezone = new DateTimeZone($this->timeZone);
        $now = new DateTime('now', $timezone);
        $hour = (int)$now->format('H');
        $dayOfWeek = (int)$now->format('N');
        
        // Weekend greetings
        if ($dayOfWeek > 5) {
            if ($hour >= 6 && $hour < 12) {
                return '¡Buen fin de semana!';
            } elseif ($hour >= 12 && $hour < 19) {
                return '¡Que disfrutes el finde!';
            } else {
                return '¡Buen descanso!';
            }
        }
        
        // Weekday greetings
        if ($hour >= 6 && $hour < 12) {
            return '¡Buen día!';
        } elseif ($hour >= 12 && $hour < 19) {
            return '¡Buenas tardes!';
        } else {
            return '¡Buenas noches!';
        }
    }
    
    /**
     * Format currency for Argentine display
     */
    public function formatCurrency(float $amount): string {
        return 'AR$ ' . number_format($amount, 0, ',', '.');
    }
    
    /**
     * Get Argentine holidays and special dates
     */
    public function getArgentineHolidays(): array {
        $currentYear = date('Y');
        
        return [
            'fixed_holidays' => [
                '01-01' => 'Año Nuevo',
                '02-14' => 'San Valentín',
                '03-24' => 'Día de la Memoria',
                '04-02' => 'Día del Veterano',
                '05-01' => 'Día del Trabajador',
                '05-25' => 'Revolución de Mayo',
                '06-20' => 'Día de la Bandera',
                '07-09' => 'Día de la Independencia',
                '08-17' => 'San Martín',
                '10-12' => 'Día del Respeto',
                '11-20' => 'Día de la Soberanía',
                '12-08' => 'Inmaculada Concepción',
                '12-25' => 'Navidad'
            ],
            'moveable_holidays' => [
                'carnaval' => 'Carnaval',
                'jueves_santo' => 'Jueves Santo',
                'viernes_santo' => 'Viernes Santo',
                'pascuas' => 'Pascuas'
            ],
            'special_dates' => [
                '03-08' => 'Día de la Mujer',
                '04-30' => 'Día del Animal',
                '05-02' => 'Día del Trabajador (puente)',
                '09-11' => 'Día del Maestro',
                '09-21' => 'Día del Estudiante',
                '10-31' => 'Halloween (no tradicional)',
                '11-02' => 'Día de los Muertos (no tradicional)'
            ]
        ];
    }
    
    /**
     * Get business day status and expectations
     */
    private function getBusinessStatus(DateTime $dateTime): string {
        if ($this->isWeekend($dateTime)) {
            return 'weekend';
        }
        
        if ($this->isBusinessHours($dateTime)) {
            return 'active';
        }
        
        return 'after_hours';
    }
    
    /**
     * Get response time expectations
     */
    private function getResponseExpectation(DateTime $dateTime): string {
        $status = $this->getBusinessStatus($dateTime);
        
        switch ($status) {
            case 'active':
                return 'Respuesta en minutos';
            case 'after_hours':
                return 'Respuesta al día siguiente';
            case 'weekend':
                return 'Respuesta el lunes';
            default:
                return 'Respuesta en horario laboral';
        }
    }
    
    /**
     * Check if current time is within business hours
     */
    private function isBusinessHours(DateTime $dateTime): bool {
        $hour = (int)$dateTime->format('H');
        $dayOfWeek = (int)$dateTime->format('N');
        
        return $dayOfWeek <= 5 && $hour >= 9 && $hour < 18;
    }
    
    /**
     * Check if current day is weekend
     */
    private function isWeekend(DateTime $dateTime): bool {
        $dayOfWeek = (int)$dateTime->format('N');
        return $dayOfWeek > 5;
    }
    
    /**
     * Get next business day
     */
    private function getNextBusinessDay(DateTime $dateTime): DateTime {
        $nextDay = clone $dateTime;
        
        do {
            $nextDay->add(new DateInterval('P1D'));
        } while ($this->isWeekend($nextDay));
        
        return $nextDay;
    }
    
    /**
     * Get relative time in Spanish
     */
    private function getRelativeTime(DateTime $dateTime): string {
        $now = new DateTime('now', new DateTimeZone($this->timeZone));
        $diff = $now->diff($dateTime);
        
        if ($diff->d > 7) {
            return $dateTime->format('d/m/Y');
        } elseif ($diff->d > 0) {
            return $diff->d === 1 ? 'ayer' : "hace {$diff->d} días";
        } elseif ($diff->h > 0) {
            return $diff->h === 1 ? 'hace 1 hora' : "hace {$diff->h} horas";
        } elseif ($diff->i > 0) {
            return $diff->i === 1 ? 'hace 1 minuto' : "hace {$diff->i} minutos";
        } else {
            return 'ahora mismo';
        }
    }
    
    /**
     * Get Spanish day name
     */
    private function getSpanishDayName(int $dayNumber): string {
        $days = [
            1 => 'lunes',
            2 => 'martes',
            3 => 'miércoles',
            4 => 'jueves',
            5 => 'viernes',
            6 => 'sábado',
            7 => 'domingo'
        ];
        
        return $days[$dayNumber] ?? 'día';
    }
    
    /**
     * Get Spanish month name
     */
    private function getSpanishMonthName(int $monthNumber): string {
        $months = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre'
        ];
        
        return $months[$monthNumber] ?? 'mes';
    }
    
    /**
     * Get work culture insights
     */
    public function getWorkCulture(): array {
        return [
            'communication_style' => [
                'formal' => 'Usted',
                'informal' => 'Vos/Tú',
                'business_default' => 'Formal al inicio, informal después'
            ],
            'meeting_culture' => [
                'punctuality' => 'Se espera puntualidad en reuniones de trabajo',
                'social_time' => 'Es común charlar unos minutos antes de entrar en tema',
                'mate_culture' => 'El mate puede estar presente en reuniones informales'
            ],
            'work_schedule' => [
                'standard' => '9:00 - 18:00 hs',
                'lunch_break' => '12:00 - 13:00 hs',
                'flexible' => 'Muchas empresas ofrecen horarios flexibles',
                'siesta' => 'No es común la siesta en horario laboral'
            ],
            'payment_culture' => [
                'invoice_payment' => '30 días es estándar',
                'freelance_payment' => 'Se prefiere pago contra entrega',
                'anticipos' => 'Es común pedir 50% de anticipo',
                'currency' => 'Precios en pesos argentinos'
            ]
        ];
    }
}
?>