import { Component, OnInit } from '@angular/core';
import { ServerService } from './service/server.service';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { BehaviorSubject, Observable, catchError, map, of, startWith } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { Server } from './interface/server';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  appState$: Observable<AppState<CustomResponse>>; // the variable that will keep track of the app's state, and data

  readonly DataState = DataState;
  // variable to use to check the state of the app if it's loading, loaded, or error

  readonly Status = Status;
  // variable to check the status of server in html, to change it in UI.

  private filterSubject = new BehaviorSubject<string>('');
  filterStatus$ = this.filterSubject.asObservable();
  // this is a variable used for the spinner when pinging
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();
  // this is a variable used for the spinner when saving a new server

  constructor(private serverService: ServerService) {}

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$.pipe(
      map(response => {
        this.dataSubject.next(response);
        // this is to have a copy of the data, so we can modify it later in other methods if we need to
        return {
          dataState: DataState.LOADED_STATE,
          appData: {...response, data: { servers: response.data.servers.reverse() }},
          // this is just so that whatever is added last stayed at the top in the UI, since by default it will be at the end.
        }
      }),
      startWith({
        dataState: DataState.LOADING_STATE
      }),
      catchError((error: string) => {
        return of({dataState: DataState.ERROR_STATE, error: error})
      })
    )
  } // this method will be called whenever the component is instantiated
  // this method will map the response that we get from the backend into an app state observable, but since that will take some time to get the list of servers from the backend, we will start with and object that is in the loading stat, and if an error occur, then we will have an app state with an error state


  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    // this is so that when the ping method is called, when subscribing to the filter observable it will be equal to the ipAddress and so the spinner will be in the UI
    this.appState$ = this.serverService.ping$(ipAddress).pipe(
      map(response => {
        const index = this.dataSubject.value.data.servers.findIndex(server =>server.id === response.data.server.id);
        this.dataSubject.value.data.servers[index] = response.data.server;
        this.filterSubject.next('');
        // this is so the spinner goes away and the ping icon returns after the ping is over
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE, appData: this.dataSubject.value
      }),
      // the startwith method here will take as data the existing data we have before the response of pinging the server arrives, which is saved in the datasubject variable and can be accessed through the .value
      catchError((error: string) => {
        this.filterSubject.next('');
        return of({dataState: DataState.ERROR_STATE, error: error})
      })
    )
  }
  // so what's happening here is that we are updating the server that is being pinged, and we are changing it to the server we are getting back in the response since the ping method in the backend returns the updated server, also the change is happening in the dataSubject variable since it is the variable that keeps track of the data we have for future use.



  filterServers(value: string): void {
    const status: Status = value === "ALL" ? Status.ALL : value === "SERVER_UP" ? Status.SERVER_UP : Status.SERVER_DOWN;
    // get the status according to selected value string
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value).pipe(
      map(response => {
        return {
          dataState: DataState.LOADED_STATE,
          appData: response,
          // we make the appData the new filtered response
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE, appData: this.dataSubject.value
      }),
      catchError((error: string) => {
        return of({dataState: DataState.ERROR_STATE, error: error})
      })
    )
  }



  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    // change the loading subject's value to true since it should load after saving
    this.appState$ = this.serverService.save$(serverForm.value).pipe(
      map(response => {
        this.dataSubject.next(
          {...response, data: {servers: [response.data.server, ...this.dataSubject.value.data.servers]}}
        );
        // save the new object in the response to the start of the dataSubject variable
        document.getElementById('closeModal').click();
        // so the modal closes after adding the new server
        this.isLoading.next(false);
        // to stop the spinner
        serverForm.resetForm({ status: this.Status.SERVER_DOWN });
        // this is just to have by default the server down when reseting the form
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
          // we make the appData the new filtered response
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE, appData: this.dataSubject.value
      }),
      catchError((error: string) => {
        this.isLoading.next(false);
        return of({dataState: DataState.ERROR_STATE, error: error})
      })
    )
  }



  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id).pipe(
      map(response => {
        this.dataSubject.next(
          {...response, data: {
            servers: this.dataSubject.value.data.servers.filter(newServer => newServer.id !== server.id)}}
            // remove the server that has the id the client wants to it.
        )
        return {
          dataState: DataState.LOADED_STATE,
          appData: this.dataSubject.value,
        }
      }),
      startWith({
        dataState: DataState.LOADED_STATE, appData: this.dataSubject.value
      }),
      catchError((error: string) => {
        return of({dataState: DataState.ERROR_STATE, error: error})
      })
    )
  }


  printReport(): void {
    window.print();
    // this is a built in method that allows us to save the report as a pdf if we want.

    // down here is a method to download the report as an Excel sheet

    // let dataType = 'applicaton/vnd.ms-excel.sheet.macroEnabled.12';
    // // this is the data format
    // let tableSelect = document.getElementById("servers");
    // let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    // // to replace the space with it's url encoded value
    // let downloadLink = document.createElement("a");
    // document.body.appendChild(downloadLink);
    // // to add the anchor tag to the html
    // downloadLink.href = 'data: ' + dataType + ', ' + tableHtml;
    // // the link
    // downloadLink.download = 'server-report.xls';
    // // name of the downloaded file
    // downloadLink.click();
    // document.body.removeChild(downloadLink);
  }
}
