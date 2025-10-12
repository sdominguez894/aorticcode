import { PatientMeasurements } from '/static/domain/value-objects/PatientMeasurements.js';

/**
 * Adapter that reads patient measurements directly from the DOM form.
 * Implements the PatientMeasurementsProvider port.
 */
export class PatientMeasurementsProvider
{
    /**
     * @param {Object} selectors - CSS selectors for measurement inputs.
     * @param {string} selectors.neckSelector
     * @param {string} selectors.contralateralIliacSelector
     * @param {string} selectors.ipsilateralIliacSelector
     * @param {string} selectors.contralateralDistanceSelector
     * @param {string} selectors.ipsilateralDistanceSelector
     * 
     * @throws {Error} If any selector does not match an element.
     */
    constructor({
        neckSelector,
        contralateralIliacSelector,
        ipsilateralIliacSelector,
        contralateralDistanceSelector,
        ipsilateralDistanceSelector
    })
    {
        this.neckEl = document.querySelector(neckSelector);
        this.contralateralIliacEl = document.querySelector(contralateralIliacSelector);
        this.ipsilateralIliacEl = document.querySelector(ipsilateralIliacSelector);
        this.contralateralDistanceEl = document.querySelector(contralateralDistanceSelector);
        this.ipsilateralDistanceEl = document.querySelector(ipsilateralDistanceSelector);

        const missing = [
            !this.neckEl && neckSelector,
            !this.contralateralIliacEl && contralateralIliacSelector,
            !this.ipsilateralIliacEl && ipsilateralIliacSelector,
            !this.contralateralDistanceEl && contralateralDistanceSelector,
            !this.ipsilateralDistanceEl && ipsilateralDistanceSelector
        ].filter(Boolean);

        if (missing.length)
        {
            throw new Error(
                `PatientMeasurementsProvider: Missing DOM elements for selectors: ${missing.join(', ')}`
            );
        }
    }

    /**
     * Reads current form values and returns a valid PatientMeasurements object.
     * @returns {Promise<PatientMeasurements>}
     */
    getPatientMeasurements()
    {
        const data = {
            neckDiameter: this._parse(this.neckEl.value),
            contralateralIliacDiameter: this._parse(this.contralateralIliacEl.value),
            ipsilateralIliacDiameter: this._parse(this.ipsilateralIliacEl.value),
            contralateralDistance: this._parse(this.contralateralDistanceEl.value),
            ipsilateralDistance: this._parse(this.ipsilateralDistanceEl.value)
        };

        return new PatientMeasurements(data);
    }

    /** @param {string} value @returns {number} */
    _parse(value)
    {
        const n = Number.parseFloat(String(value).trim());
        if (!Number.isFinite(n))
        {
            throw new Error('Invalid numeric input.');
        }
        return n;
    }
}
