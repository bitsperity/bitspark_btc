<script>
  import { createEventDispatcher } from 'svelte';
  import { developerManager } from '../../backend/DeveloperManager.js';

  export let jobId;
  console.log('ApplicationModal initialized with jobId:', jobId);
  
  const dispatch = createEventDispatcher();
  
  let content = "";
  let bid = "";
  let duration = "";
  let startDate = "";
  let termsOfAgreement = "";
  let isSubmitting = false;
  let error = null;

  async function handleSubmit() {
    if (!content.trim()) {
      error = 'Bitte beschreiben Sie Ihre Erfahrung und Ihren Ansatz.';
      return;
    }

    if (!bid || isNaN(bid) || bid <= 0) {
      error = 'Bitte geben Sie eine gültige Preisvorstellung ein.';
      return;
    }

    if (!duration || isNaN(duration) || duration <= 0) {
      error = 'Bitte geben Sie eine gültige Dauer in Tagen ein.';
      return;
    }

    if (!startDate) {
      error = 'Bitte wählen Sie ein Startdatum.';
      return;
    }

    if (!termsOfAgreement.trim()) {
      error = 'Bitte geben Sie Ihre Bedingungen an.';
      return;
    }

    error = null;
    isSubmitting = true;

    try {
      console.log('Submitting application with data:', {
        content,
        jobId,
        bid,
        duration,
        startDate,
        termsOfAgreement
      });

      await developerManager.submitJobApplication(
        content,
        jobId,
        parseInt(bid),
        parseInt(duration),
        startDate,
        termsOfAgreement
      );
      
      console.log('Application submitted successfully');
      dispatch('success');
    } catch (err) {
      error = err.message;
      console.error('Fehler beim Senden der Bewerbung:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<div 
  class="modal-overlay" 
  on:click|self={handleClose}
  role="dialog"
  aria-labelledby="modal-title"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Bewerbung einreichen</h2>
      <button class="close-btn" on:click={handleClose}>
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="modal-body">
      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}

      <div class="form-group">
        <label for="content">Beschreibung</label>
        <textarea
          id="content"
          bind:value={content}
          placeholder="Beschreiben Sie Ihre relevante Erfahrung und wie Sie den Job angehen würden..."
          rows="6"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="bid">Preisvorstellung (Sats)</label>
          <input
            id="bid"
            type="number"
            bind:value={bid}
            min="1"
            placeholder="z.B. 100000"
          />
        </div>

        <div class="form-group">
          <label for="duration">Geschätzte Dauer (Tage)</label>
          <input
            id="duration"
            type="number"
            bind:value={duration}
            min="1"
            placeholder="z.B. 14"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="startDate">Mögliches Startdatum</label>
        <input
          id="startDate"
          type="date"
          bind:value={startDate}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div class="form-group">
        <label for="terms">Bedingungen</label>
        <textarea
          id="terms"
          bind:value={termsOfAgreement}
          placeholder="Beschreiben Sie Ihre Bedingungen für die Zusammenarbeit..."
          rows="4"
        ></textarea>
      </div>
    </div>

    <div class="modal-footer">
      <button class="cancel-btn" on:click={handleClose} disabled={isSubmitting}>
        Abbrechen
      </button>
      <button class="submit-btn" on:click={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
      </button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9998;
  }

  .modal-content {
    background: white;
    width: 90%;
    max-width: 800px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
    z-index: 9999;
  }

  .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.5rem;
  }

  .modal-body {
    padding: 2rem;
    overflow-y: auto;
  }

  .error-message {
    background: #fff5f5;
    color: #c53030;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  textarea {
    resize: vertical;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #2c5282;
    box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
  }

  .modal-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .cancel-btn {
    background: white;
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .cancel-btn:hover:not(:disabled) {
    background: #f3f4f6;
  }

  .submit-btn {
    background: #2c5282;
    border: none;
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: #1a365d;
  }

  @media (max-width: 768px) {
    .modal-content {
      width: 95%;
      max-height: 90vh;
    }
  }
</style> 