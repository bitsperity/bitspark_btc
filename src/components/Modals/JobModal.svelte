<script>
    import { createEventDispatcher } from 'svelte';
    import { jobManager } from '../../backend/JobManager.js';
    import MultiSelectDropdown from '../Dropdowns/MultiSelectDropdown.svelte';
    import { job_categories, coding_language } from '../../constants/categories.js';
  
    export let ideaID;
    const dispatch = createEventDispatcher();
  
    let jobData = {
      title: '',
      abstract: '',
      description: '',
      requirements: '',
      categories: [],
      languages: []
    };
  
    async function handleSubmit() {
      try {
        await jobManager.createJob(ideaID, jobData);
        dispatch('submit');
        dispatch('close');
      } catch (error) {
        console.error('Error creating job:', error);
      }
    }
  
    function handleKeydown(event) {
      if (event.key === 'Escape') {
        dispatch('close');
      }
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown}/>
  
  <div 
    class="modal-overlay" 
    on:click|self={() => dispatch('close')}
    on:keydown|self={() => dispatch('close')}
    role="dialog"
    aria-labelledby="modal-title"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title">Create New Job</h2>
        <button class="close-btn" on:click={() => dispatch('close')}>
          <i class="fas fa-times"></i>
        </button>
      </div>
  
      <div class="modal-body">
        <div class="form-grid">
          <!-- Linke Spalte -->
          <div class="left-column">
            <div class="form-group">
              <label for="title">Job Title</label>
              <input 
                id="title"
                type="text" 
                bind:value={jobData.title}
                placeholder="Enter a descriptive title"
              />
            </div>
  
            <div class="form-group">
              <label for="abstract">Overview</label>
              <textarea
                id="abstract"
                bind:value={jobData.abstract}
                placeholder="Brief summary of the job"
                rows="3"
              />
            </div>
          </div>
  
          <!-- Rechte Spalte -->
          <div class="right-column">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                bind:value={jobData.description}
                placeholder="Detailed job description"
                rows="4"
              />
            </div>
  
            <div class="form-group">
              <label for="requirements">Requirements</label>
              <textarea
                id="requirements"
                bind:value={jobData.requirements}
                placeholder="Technical requirements"
                rows="4"
              />
            </div>
          </div>
        </div>
  
        <div class="categories-section">
          <div class="form-group">
            <label for="categories">Categories</label>
            <MultiSelectDropdown
              id="categories"
              categories={job_categories}
              bind:selected={jobData.categories}
            />
          </div>
  
          <div class="form-group">
            <label for="languages">Programming Languages</label>
            <MultiSelectDropdown
              id="languages"
              categories={coding_language}
              bind:selected={jobData.languages}
            />
          </div>
        </div>
      </div>
  
      <div class="modal-footer">
        <button class="cancel-btn" on:click={() => dispatch('close')}>Cancel</button>
        <button class="submit-btn" on:click={handleSubmit}>Create Job</button>
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
      z-index: 1000;
    }
  
    .modal-content {
      background: white;
      width: 90%;
      max-width: 1000px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      max-height: 85vh;
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
  
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
  
    .form-group {
      margin-bottom: 1.5rem;
    }
  
    .form-group label {
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
  
    input:focus, textarea:focus {
      outline: none;
      border-color: #2c5282;
      box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
    }
  
    .categories-section {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
    }
  
    .modal-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }
  
    .cancel-btn, .submit-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
  
    .cancel-btn {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }
  
    .submit-btn {
      background: #2c5282;
      border: none;
      color: white;
    }
  
    .cancel-btn:hover {
      background: #f3f4f6;
    }
  
    .submit-btn:hover {
      background: #1a365d;
    }
  
    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
  
      .modal-content {
        width: 95%;
        max-height: 90vh;
      }
    }
  </style>