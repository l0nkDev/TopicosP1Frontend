import { HttpClient } from "@angular/common/http";
import { Component, inject } from "@angular/core";
import { retry, timeout } from "rxjs";
import { environment } from "../../../environments/environment.development";

export interface Submission {
  token: string;
  status: string;
  timestamp: string;
  details: string;
  refreshing?: boolean;
}

@Component({
  selector: 'app-transactionhistory',
  templateUrl: './transactionhistory.html'
})
export class HistoryComponent {
  private http = inject(HttpClient)
  submissions: any[] = [];
  expanded = false;
  errortext = '';

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  expand() {
    this.expanded = true;
  }

  addSubmission(submission: Submission) {
    this.submissions.unshift(submission);
    console.log(this.submissions);
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ACCEPTED':
        return 'Aceptado';
      case 'REJECTED':
        return 'Rechazado';
      case 'ERROR':
        return 'Error';
      default:
        return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'bi-hourglass-split';
      case 'ACCEPTED': return 'bi-check-circle';
      case 'REJECTED': return 'bi-x-circle';
      case 'ERROR': return 'bi-exclamation-triangle';
      default: return 'bi-question-circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'lightyellow';
      case 'ACCEPTED': return 'lightgreen';
      case 'REJECTED': return 'lightcoral';
      case 'ERROR': return 'lightcoral';
      default: return '';
    }
  }

  refreshSubmission(index: number) {
    const submission = this.submissions[index];
    if (submission) {
      submission.errortext = '';
      submission.refreshing = true;
      this.http.get(`${environment.API_URL}Inscriptions/Status/${submission.token}`)
          .pipe(timeout(10000), retry(2))
          .subscribe((response: any) => {
            console.log(response);
            submission.refreshing = false;
            submission.status = response.status;
            console.log(response.status);
            if (response.result != null)
              if (response.result.statusCode != null)
                if (response.result.statusCode === 409 && response.error != undefined) {
                  submission.status = 'REJECTED';
                  submission.errortext = "Conflicto de horarios.";
                }
            if (response.result.value.errors.length > 0) {
              submission.status = 'REJECTED';
              submission.errortext = "Se acabaron los cupos disponibles.";
            } else {
            }
          });
    }
  }
}
