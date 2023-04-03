<!-- Inspired by -->
<!-- https://stackabuse.com/how-to-create-a-confirmation-dialogue-in-vue-js/ -->
<template>
    <div class="modal-mask" v-if="showModal">
      <div class="modal-wrapper">
        <div class="modal-container">
            <div class="modal-header">
                {{title}}
            </div>
            <div class="modal-body">
                {{message}}
            </div>
            <div class="modal-footer">
                <button type="button" @click="cancel">{{module.tt('cancel')}}</button>
                <button type="button" @click="confirm">{{module.tt('confirm')}}</button>
            </div>
        </div>
      </div>
    </div>
</template>

<script>
export default {
    name: 'ConfirmationModal',
    inject: ['module'],
    data() {
        return {
            showModal: false,
            title: '',
            message: '',
            resolvePromise: null,
            rejectPromise: null,
        };
    },
    methods: {
        show(opts = {}) {
            this.showModal = true;
            this.title = opts.title || '';
            this.message = opts.message || '';

            return new Promise((resolve, reject) => {
                this.resolvePromise = resolve;
                this.rejectPromise = reject;
            });
        },

        confirm() {
            this.showModal = false;
            this.resolvePromise(true);
        },

        cancel() {
            this.showModal = false;
            this.resolvePromise(false);
        },
    }

};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 600px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.modal-footer {
    text-align: left;
    border-width: 1px 0 0 0;
    background-image: none;
    margin-top: 0.5em;
    padding: 0.3em 1em 0.5em 0.4em;
}

.modal-footer button {
    padding: 0.3em 1em 0.4em;
    float: right;
    border: 1px solid #ccc;
    background: #e6e6e6;
    margin: 0.5em 0.4em 0.5em 0;
    cursor: pointer;
    border-bottom-right-radius: 3px;
    border-bottom-left-radius: 3px;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    
}

</style>