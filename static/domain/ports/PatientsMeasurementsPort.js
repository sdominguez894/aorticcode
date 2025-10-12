import { PatientMeasurementsProvider } from '/static/infrastructure/providers/PatientMeasurementsProdiver.js';

/**
 * Outbound port for retrieving patient measurement data.
 *
 * The application/service layer depends on this interface,
 * while infrastructure adapters (UI, API, etc.) implement it.
 *
 * @interface
 */
export class PatientMeasurementsPort
{
    /**
     * Retrieves all anatomical measurements for a given patient.
     *
     * @returns {PatientMeasurements}
     */
    getPatientMeasurements()
    {
        return PatientMeasurementsProvider.getPatientMeasurements();
    }
}
