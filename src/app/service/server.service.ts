import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Status } from 'app/enum/status.enum';
import { CustomResponse } from 'app/interface/custom-response';
import { Server } from 'app/interface/server';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable({providedIn: 'root'})
export class ServerService {
  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {} // this is the http Client that we will use to make http request to the backend

  // getServers(): Observable<CustomResponse> {
  //   return this.http.get<CustomResponse>('http://localhost:8080/server/list'); // this is the typical/procedal way to get the list of servers from the backend
  // }

  servers$ = <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/server/list`).pipe(
    tap(console.log), // log the response to the console
    catchError(this.handleError) // and handle any error it might have
  );// the pipe method will take the returned value from the get method and apply the two following operators on it (it is used to combine functions together)
    // $ sign indicates that sever is an observable
    // this is not the usual procedural way, but the reactive way to make requests to the backend
    // <Observable<CustomResponse>> after the equals operators is just a type of casting so that the servers$ will be specifically a custom response observable



    save$ = (server: Server) => <Observable<CustomResponse>>this.http.post<CustomResponse>(`${this.apiUrl}/server/save`, server).pipe(
      tap(console.log),
      catchError(this.handleError)
    );
    // the server is the request body that we will get from the user, and we are passing it as the payload of the post method



    ping$ = (ipAddress: string) => <Observable<CustomResponse>>this.http.get<CustomResponse>(`${this.apiUrl}/server/ping/${ipAddress}`).pipe(
      tap(console.log),
      catchError(this.handleError)
    );


    delete$ = (id: number) => <Observable<CustomResponse>>this.http.delete<CustomResponse>(`${this.apiUrl}/server/delete/${id}`).pipe(
      tap(console.log),
      catchError(this.handleError)
    );



    filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      subscriber => {
        console.log(response);
        subscriber.next(
          status === Status.ALL ? {...response, message: `Servers filtered by ${status} status`} :
          {
            ...response,
            message: response.data.servers.
            filter(server => server.status == status).length > 0 ? `Servers filtered by
            ${status == Status.SERVER_UP ? 'Server Up' : 'Server Down'} status` : `No servers of ${status} found`,
            data: {servers: response.data.servers?.filter(server => server.status == status)}
          }
        );
        subscriber.complete();
      }
    ).pipe(
      tap(console.log),
      catchError(this.handleError)
    );
    // what's happening here is that we are creating a method to filter servers according to specified status
    // taking a chosen status, and response which cotains the current data as parameter
    // we are returning a new custom response observable that takes a subscriber and first log the response and then calls the next method of the subscriber which basically records the data that we are going to send to the subscriber, in it we will filter the response according to the status, and then call the complete method which specifies that the observable is over?


    private handleError(error: HttpErrorResponse): Observable<never> {
      console.log(error);
      return throwError (`An error occured - Error Code: ${error.status}`);
    }
    // this method can help in debugging, since it logs the errors we might get when making api calls
}
