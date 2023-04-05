<template>
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
            <div class="modal-header">
                <h3>{{ module.tt('dashboard_saved') }}</h3>
            </div>
            <div class="modal-body">
                <p> {{module.tt('dashboard_named_saved', this.name)}} </p>
            </div>
            <div class="modal-footer">
                <button type="button" @click="$emit('close')">{{module.tt('continue_editing')}}</button>
                <button type="button" @click="viewList()">{{module.tt('return_to_list')}}</button>
                <button type="button" @click="viewDash()">{{module.tt('view_dashboard')}}</button>
            </div>
        </div>
      </div>
    </div>
</template>

<script>
export default {
    name: 'SavedModal',
    inject: ['module'],
    props: {
        name: {
            type: String,
            default: "No name provided",
        },
        list_link: {
            type: String,
            default: "#",
        },
        dash_link: {
            type: String,
            default: "#",
        },
    },
    methods: {
        viewList() {
            window.location.href = this.list_link;
        },
        viewDash() {
            window.location.href = this.dash_link;
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